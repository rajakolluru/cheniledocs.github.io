---
layout: doc
title: Process management vs. Temporal
description: Orchestration as data in your own database, or orchestration as replayed code on a dedicated cluster — how Chenile process management compares with Temporal.
permalink: /developer/process-vs-temporal/
---

# Process management vs. Temporal

Both Chenile [process management](/developer/process-management/) and Temporal run long, multi-step work reliably across crashes, with retries and horizontally scaled workers — from opposite philosophies.

- **Chenile: orchestration as data.** A state machine plus `Process` rows in your own database; workers do the work and raise events; a [transactional outbox](/developer/process-outbox/) makes each transition's consequences durable. Nothing is replayed, so there is no determinism constraint.
- **Temporal: orchestration as code.** An ordinary-looking workflow function that Temporal makes crash-proof by event-sourcing and deterministically replaying it on a dedicated cluster.

## Side by side

| Dimension | Chenile process management | Temporal |
|---|---|---|
| Model | Declarative STM + durable command handlers | Imperative workflow-as-code, deterministic replay |
| Authoritative state | Rows in your own database — inspectable, repairable | Event history in the Temporal cluster |
| Deployment | A library plus your database; no extra cluster | Separate cluster, or Temporal Cloud |
| Durable execution | Transactional outbox + poller | Event-sourced replay |
| Exactly-once local effects | Consumer receipts + claim-token fencing, one transaction | Recorded in history |
| External effects | At-least-once; receivers deduplicate (`WorkerDto.dispatchId`) | At-least-once activities; make them idempotent |
| Crash recovery | Lease reclaim + stale-claimant fencing | Automatic via replay |
| Retries / dead-letter | Exponential backoff, max attempts, `DEAD`, compensation, `replayDead` | Per-activity retry policies |
| Timers / cron | Visibility delay + entry-level Quartz crontabs | Native durable timers and schedules |
| Signals / queries | Events via REST/STM + durable parent signalling | First-class signals and queries |
| Visibility | SQL over process/trigger/outbox tables + the [admin dashboard](/developer/process-admin/) | Web UI + searchable history |
| Scaling | `FOR UPDATE SKIP LOCKED` + database backlog (KEDA) | Task queues + workers |
| Scope | Splitter/aggregator trees and process chaining | General-purpose workflows |

## Choosing

For the orchestration Chenile models — worker dispatch, child creation, parent signalling, completion and chaining — the two are in the same class on durability and exactly-once semantics. **Temporal is the broader engine**: arbitrary control flow, durable timers, signals and queries, per-activity retries and a history UI. **Chenile is simpler to run and reason about**: authoritative state in a database you already operate, no determinism rules, no separate cluster.

Choose **Chenile** for fan-out/fan-in batch work (and chains of it) that belongs in your own database, alongside services already governed by Chenile. Choose **Temporal** for arbitrary-shape workflows that need its richer primitives and justify operating a cluster.

<div class="callout"><div class="t">Source</div>
Condensed from <code>docs/temporal-comparison.md</code> in <code>ajapros/chenile-process-management</code>, which also covers durability arguments and caveats in depth.</div>
