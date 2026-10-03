---
layout: doc
title: Durable process outbox
description: Make every consequence of a process transition survive a crash — a transactional outbox with consumer receipts, lease fencing, retries, dead-letter and replay.
permalink: /developer/process-outbox/
---

# Durable process outbox

> **Release status:** new in 2.1.31 — `chenile-parent:2.1.31` is on Maven Central; the `chenile-process-management` artifacts follow in the [release train](/developer/release-process/). Opt-in; the default remains synchronous inline execution.

When a [process](/developer/process-management/) changes state, things must happen as a consequence: create a child, signal the parent, start a worker, emit completion. By default those run **inline**. For deployments that need every consequence to survive a crash, `process-outbox` writes each one as a row **in the same database transaction that saves the `Process`** — so a state change and its scheduled consequences commit together or not at all — and a dispatcher executes them with at-least-once delivery and exactly-once effects.

## Enable it

Apply `process-outbox/src/main/resources/chenile-process-outbox-schema.sql` with your migration tool, then:

```properties
chenile.process.outbox.enabled=true
chenile.process.outbox.run-dispatcher=true
chenile.process.outbox.poll-interval-millis=1000
chenile.process.outbox.worker-id=process-replica-1
chenile.process.outbox.lock-seconds=300
chenile.process.outbox.max-attempts=5
```

PostgreSQL is the reference database. Process JPA, outbox JDBC and the JDBC worker starter **must share one DataSource and transaction manager**. Provision at least two connections per concurrent dispatch thread plus request traffic, and keep database/JDBC timezones on UTC for leases. For local development only, `spring.sql.init.schema-locations=classpath:chenile-process-outbox-schema.sql` can load the schema.

## Four commands, one lifecycle

| Command | Effect |
|---|---|
| `CREATE_SUBPROCESS` — `CreateSubProcessCommand` | create a child process |
| `SIGNAL_PARENT` — `SignalParentCommand` | deliver `subProcessDoneSuccessfully` / `subProcessDoneWithErrors` to the parent |
| `EMIT_COMPLETED` — `EmitCompletedCommand` | run framework chaining and best-effort subscriber fan-out; record completion history |
| `START_WORKER` — `StartWorkerCommand` | hand a serialized `WorkerDto` to the configured starter |

Each implements `OutboxCommandLifecycle<C>` — `enqueue(context)`, `dispatch(entry)`, `onDead(entry)` and a stable `type()` — and owns its JSON payload. `ProcessEntryAction` always delegates to `ProcessEffects`; `ProcessCommandSupport` either **persists** the command (durable mode) or **invokes it immediately** with live typed objects (inline mode). The same commands therefore run in both modes, with no duplicate inline code. The table holds only shared delivery metadata plus a `payload` JSON column — new commands need no new columns.

**Add your own command:** register a Spring bean implementing `OutboxCommandLifecycle<ProcessTransition>` (or subclass `AbstractProcessOutboxCommand`); use `store(...)` / `ProcessCommandSupport.enqueue(...)` so it works in both modes. Duplicate type registration fails at startup; unknown persisted types retry and go `DEAD` rather than being silently acknowledged.

## Guarantees

- **Enqueue joins the caller's transaction** — a rolled-back transition leaves no orphaned command.
- **Claim-token fencing** — each claim stamps a fresh token under a lease (`FOR UPDATE SKIP LOCKED`); a stale claimant whose lease was reclaimed cannot run, acknowledge or fail the work.
- **Consumer receipts** — a `chenile_process_receipt` row commits atomically with the effect and acknowledgement, so redelivery is a no-op; parent counting is receipt-guarded per parent/child pair, so a child counts exactly once.
- **Retries and dead-letter** — exponential backoff up to `max-attempts`, then `DEAD`.
- **Worker-start compensation** — a dead `START_WORKER` drives its process to the error terminal (`splitDoneWithErrors` / `doneWithErrors` / `aggregationDoneWithErrors`) so a worker that will never run doesn't park its subtree forever.

**At-least-once edges.** Effects that can't commit on the shared datasource — a broker publish from the queue starter, after-commit subscriber fan-out — are at-least-once: workers must deduplicate on `WorkerDto.dispatchId`. Durable create **returns before** workers, children and successors finish; the cascade completes as the poller drains.

## Operate it

```sql
select status, count(*), min(created_at) as oldest from chenile_process_outbox
 where status <> 'DONE' group by status;
select id, process_id, command_type, attempt, error_message
  from chenile_process_outbox where status = 'DEAD' order by updated_at;
```

Monitor `backlogCount()`, `deadCount()`, oldest outstanding age and errors. Fix the cause, then `ProcessOutboxRepository.replayDead(id)` for selected work — it resets attempts and visibility while preserving identity and receipts. **Never clear receipts** (they mean an effect already committed); no unsecured replay endpoint is shipped. Archive `DONE` rows on your own horizon; keep receipts at least as long as redelivery is possible.

Every enabled replica polls concurrently. Set `run-dispatcher=false` only where another replica drains, or where tests call `OutboxDispatcher.drainAll(100)` **after commit** — never inside the transaction that created the work.

## Migrating from the column-based prototype

Stop producers and dispatchers, back up the table, and apply `chenile-process-outbox-json-migration.sql` (transactional, re-runnable). It wraps parent-signal bodies in JSON and drops `target_id`, `event_name` and `worker_type`, preserving row IDs, delivery state, idempotency keys and receipts. Do not run old and new producers concurrently.

<div class="callout"><div class="t">Where to look</div>
Module <code>process-outbox</code> in <code>ajapros/chenile-process-management</code>; design rationale in <code>docs/adr/0001-durable-outbox-for-process-entry-action.md</code>. PostgreSQL tests are opt-in via <code>-Dchenile.outbox.test.jdbc-url=…</code> and create their own UUID-named schemas.</div>
