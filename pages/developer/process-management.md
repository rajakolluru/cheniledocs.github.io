---
layout: doc
title: Process management
description: Orchestrate long-running, tree-shaped jobs as data — split, execute, aggregate and chain processes on Chenile's state machine, with pluggable workers, triggers and an optional durable outbox.
permalink: /developer/process-management/
---

# Process management

Some work doesn't fit a single request/response: a long-running job that fans out into many sub-jobs and is only done when **all** of them finish. `chenile-process-management` orchestrates exactly this — the classic **splitter / aggregator (map-reduce)** pattern — on Chenile's [state machine](https://thefinito.org). The flow is declared once as data; the work itself is done by pluggable workers that run outside the state machine and report back by raising events.

> **2.1.31** substantially revamps this module: unified process configuration, predecessor-driven chaining, trigger lineage, an optional [durable outbox](/developer/process-outbox/), a [management API and React dashboard](/developer/process-admin/), and a [JGen blueprint](/developer/jgen-blueprints/#process-management) that generates typed multi-level process applications. See the [2.1.31 release notes](/release-notes/2.1.31/) for migration steps.

## At a glance

A trigger raises a `ProcessCreate` event that creates a root `Process`. The state machine drives it by type: a **leaf** executes directly; a **non-leaf** splits into children, waits for all of them, and aggregates — until it reaches a terminal state, `PROCESSED` or `PROCESSED_WITH_ERRORS`. On completion it emits a `ProcessCompletedEvent`, from which configured **successor** processes are created, so processes compose in sequence. Everything — process state, definitions, outbox, receipts and trigger idempotency — lives in your application's own database.

## Modules

| Module | Role |
|---|---|
| `process-api` | Shared model: `Process`, `ProcessDto`, `WorkerDto`, `WorkerType`, the `Constants` catalogue of states/events, payloads, `ProcessCompletedEvent`, the `WorkerStarter` interface and configuration abstraction (`IProcessConfigurator`, `ProcessDef`). |
| `process-service` | The running service: STM definition, transition commands, `ProcessManagerImpl`, `ProcessController`, `ProcessEntryAction`, `PostSaveHook`, the configurators, durable-execution wiring and Spring configuration. |
| `process-utils` | Worker base classes — `SplitterBase`, `ExecutorBase`, `AggregatorBase`, orchestrated by `BatchServiceBase`. |
| `process-delegate` | Client for invoking the manager remotely. |
| `process-outbox` | Transactional outbox for [durable execution](/developer/process-outbox/) (database-only, no cycle). |
| `invm-process-starter` · `q-based-process-starter` · `jdbc-process-starter` | The three interchangeable worker launch strategies. |
| `chenile-trigger` | Activation layer: durable Quartz crontabs and in-JVM trigger events — see the [trigger framework](/developer/trigger-framework/). |
| `process-admin-server` · `process-ui` | Runnable administrator host and React dashboard — see [administration](/developer/process-admin/). |

## The domain model

A `Process` carries the fields that drive orchestration: `leaf`, `processType`, `parentId`, `predecessorId`, `triggerId` (correlation to the activation that created it), the transient `subProcesses` used during a split, `splitCompleted`, the counters `numSubProcesses` / `numCompletedSubProcesses`, serialized `input` and `output`, an `errors` collection, the inherited `tenant`, and the current STM state.

## The state machine

```
            ┌── leaf ──────────▶ EXECUTING ── doneSuccessfully ──▶ PROCESSED
[create] ─▶ isThisLeafNode?          │  (statusUpdate)  └ doneWithErrors ─▶ PROCESSED_WITH_ERRORS
            └── non-leaf ─▶ SPLIT_PENDING ── splitPartiallyDone / splitDone ─▶ SUB_PROCESSES_PENDING
                                  └ splitDoneWithErrors ─▶ PROCESSED_WITH_ERRORS
SUB_PROCESSES_PENDING ── child done / splitDone ─▶ areAllSubProcessesDone?
        (numSubProcesses == numCompletedSubProcesses && splitCompleted) ─▶ AGGREGATION_PENDING
AGGREGATION_PENDING ── aggregationDone ─▶ errors? ─▶ PROCESSED | PROCESSED_WITH_ERRORS
                    └ aggregationDoneWithErrors ─▶ PROCESSED_WITH_ERRORS
```

A new process starts at `isThisLeafNode`. **There is no parked or dormant state and no separate activation event** — processes are created when triggered or when their predecessor completes (2.1.31 removed the old dormant/activate pair). The guard on `areAllSubProcessesDone` requires the split to be *finalized* **and** every child to have reported, which makes streaming/partial splits safe: children may finish before the split is declared complete without the parent deciding prematurely that it is done.

## End-to-end lifecycle

```
Trigger (Quartz crontab, HTTP, or any adapter)
  → TriggerService.trigger(TriggerInput)            idempotent on (triggerId, eventName)
  → EventProcessor.handleEvent("ProcessCreate", ProcessDto, headers)
  → ProcessManagerImpl.create(ProcessDto)            root created, trigger correlation kept
  → state machine entered → SPLITTER / EXECUTOR / AGGREGATOR worker launched
  → workers raise events (splitDone, subProcessDoneSuccessfully, aggregationDone, …)
  → children created, parents signalled, state advances
  → PROCESSED / PROCESSED_WITH_ERRORS
  → ProcessCompleted emitted → successors created as new processes
```

## HTTP and event surface

| Endpoint | Purpose |
|---|---|
| `POST /process` (also the in-JVM `ProcessCreate` event) | Create a root process from a `ProcessDto` |
| `GET /process/{id}` | Retrieve a process |
| `PATCH /process/{id}/{eventID}` | Deliver an STM event with a typed payload |
| `GET /processChildren/{id}` | The sub-process tree |
| `POST /process/completed` (also the `ProcessCompleted` event) | Completion ingress used for chaining |

```json
{ "processDefName": "feed", "args": { "file": "s3://…" }, "triggerId": "crontab:nightly:abc", "description": "Nightly feed" }
```

`create` requires `processDefName`, serializes `args` into `input`, and records `triggerId` from the payload or the `x-chenile-trigger-id` header. A direct `POST /process` always creates a new root — deduplicating repeated activations is the [trigger layer's](/developer/trigger-framework/) job, not the process manager's.

## Workers and launch modes

`PostSaveHook` resolves the worker for the current state and hands a `WorkerDto` to the configured `WorkerStarter`:

| State | Worker | Configuration |
|---|---|---|
| `SPLIT_PENDING` | `SPLITTER` | `ProcessDef.config` |
| `EXECUTING` | `EXECUTOR` | `ProcessDef.config` |
| `AGGREGATION_PENDING` | `AGGREGATOR` | `ProcessDef.config` |

Every worker type receives the **same** `config` map (copied, never mutated). Workers extend the `process-utils` base classes, which handle payload typing, tenant propagation and error reporting.

<div class="grid-3" style="margin:1.4em 0">
  <div class="card">
    <div class="ic">⚡</div>
    <h3><code>invm-process-starter</code></h3>
    <p>Dispatches the <code>WorkerDto</code> to the in-JVM event processor. Simplest — ideal for tests and small flows.</p>
  </div>
  <div class="card">
    <div class="ic">📨</div>
    <h3><code>q-based-process-starter</code></h3>
    <p>Publishes to a Chenile <a href="/concepts/07-messaging-abstraction/">pub/sub</a> topic named in the definition, forwarding <code>x-chenile-tenant-id</code>.</p>
  </div>
  <div class="card">
    <div class="ic">🗄️</div>
    <h3><code>jdbc-process-starter</code></h3>
    <p>Inserts a durable <code>chenile_process_work_item</code> (idempotency key, <code>FOR UPDATE SKIP LOCKED</code> claim, lease, retries, <code>DEAD</code>). Production-grade and <b>KEDA</b>-scalable.</p>
  </div>
</div>

## Process definitions

A `ProcessDef` describes a `processType`: whether it is a `leaf`, its `parentProcessType`, its predecessor relationship (`predecessorProcessType`, `predecessorArgs`), and **one `config` map** shared by its splitter, executor and aggregator. *(2.1.31 replaced `splitterConfig` / `executorConfig` / `aggregatorConfig` with `config`, and configured `successors` with predecessor declarations.)*

Definitions resolve through `IProcessConfigurator.findByName`, from one of two sources:

- **`chenile.process.configurator=json`** (default) — a classpath JSON resource (`defs.json`).
- **`chenile.process.configurator=database`** — `DatabaseProcessConfigurator` reads the `process_definition` table (`process_type` primary key, `definition` JSON text). Definitions are cached in a HashMap with **explicit invalidation** after committed changes; the [management API](/developer/process-admin/) edits them and refreshes the cache.

```sql
insert into process_definition (process_type, definition) values
('chunk', '{"leaf":true,"parentProcessType":"file","config":{"batchSize":"100"}}');
```

## Completion and chaining

A terminal process emits a transport-neutral `ProcessCompletedEvent` (it extends `ProcessDto`) carrying `processId`, `processType`, `tenantId`, `triggerId`, `state`, `input`, `output` and `successful`. The process manager subscribes to completion ingress: every definition whose **`predecessorProcessType`** matches the completed type is started as a new process, with **`predecessorArgs`** choosing what it receives — `INPUT`, `OUTPUT` or `BOTH` (default). Processes retain **trigger, parent and predecessor lineage**, and each completion is recorded in `chenile_process_completion_event`, so an execution can be traced end to end. Under durable execution, chaining is part of the completion command's transaction; delivery to arbitrary application subscribers stays best-effort after commit.

## Multi-tenancy

The `x-chenile-tenant-id` header is persisted as the inherited `BaseJpaEntity.tenant`, propagated to sub-processes and into the worker execution context, and carried on completion events — so chained processes and subscribers run under the same tenant. (2.1.31 also fixes tenant preservation through JPA flush.)

## Reliable failure reporting

Since [2.1.30](/release-notes/2.1.30/), worker payload failures are **reported to the process daemon** rather than logged while the worker reports success — a malformed payload, incompatible known-field type, missing payload type or invocation failure completes the work item **as an error**, so a run can't sit pending with no error record. Unknown JSON properties are tolerated for additive producer evolution.

## Configuration reference

| Property | Default | Meaning |
|---|---|---|
| `chenile.process.configurator` | `json` | `json` or `database` definition source |
| `chenile.process.outbox.enabled` | `false` | enable the [durable transactional outbox](/developer/process-outbox/) |
| `chenile.process.outbox.run-dispatcher` | `true` | run the draining poller on this instance |
| `chenile.process.outbox.poll-interval-millis` | `1000` | poller interval |
| `chenile.process.outbox.lock-seconds` | `300` | outbox command lease |
| `chenile.process.outbox.max-attempts` | `5` | retries before a command is `DEAD` |
| `chenile.process.outbox.worker-id` | hostname | claimant identity for leases |
| `chenile.process.management.enabled` | `false` | enable the [management API](/developer/process-admin/) |
| `chenile.process.management.api-key` | — | administrator key, ≥ 32 characters (required when enabled) |

## Related guides

- [Durable outbox](/developer/process-outbox/) — atomic consequences, receipts, fencing, dead-letter and replay.
- [Administration API, dashboard & server](/developer/process-admin/) — crons, manual triggers, definitions, process trees and traces.
- [Trigger framework](/developer/trigger-framework/) — idempotent activation and execution history.
- [Process management vs. Temporal](/developer/process-vs-temporal/) — when to choose which.
- [JGen process-management blueprint](/developer/jgen-blueprints/#process-management) — generate a typed, multi-level process application.

<div class="callout"><div class="t">Where to look</div>
Repository <code>ajapros/chenile-process-management</code>: the state machine is <code>process-service/src/main/resources/org/chenile/orchestrator/process/process-states.xml</code>; design decisions live under <code>docs/adr</code>. Integration tests (<code>TestFeeds</code>, <code>TestFile</code>, <code>TestChunks</code>) drive a full feed → file → chunk cascade in synchronous and asynchronous modes.</div>
