---
layout: doc
title: Trigger framework architecture
description: Trigger ingress, durable Quartz schedules, idempotency, and separate execution history for Chenile process starts.
permalink: /developer/trigger-framework/
---

# Trigger framework architecture

> **Release status:** new in 2.1.31 — `chenile-parent:2.1.31` is on Maven Central; the `chenile-process-management` artifacts follow in the [release train](/developer/release-process/).

Chenile's trigger framework normalizes external activation into an existing in-JVM
Chenile event. It does not create a second event bus: after validation, the framework
invokes the existing `EventProcessor` synchronously.

## Common trigger envelope

Every source produces a fully formed trigger input: trigger ID, event ID, trigger time, headers,
and event payload. Quartz adds schedule identity and fire times to the headers. An adapter
supplies the trigger ID, or the framework generates one when absent. A completed trigger/event
pair is never dispatched twice.

## Direct events and durable crontabs

There is no trigger-to-event mapping configuration. A trigger is already an event: its adapter
supplies the event ID, payload, and headers. The Chenile event definition determines the Java
type used to construct the event-processor payload. Event consumers validate their own mandatory
fields; for example, the `ProcessCreate` `ProcessDto` payload contains its ProcessDef name and
arguments.

Quartz schedules have a separate durable `chenile_crontab` table. Each row contains its name,
enabled flag, cron expression, timezone, destination event, optional headers and event-payload
JSON. The event-payload JSON is the complete payload for the configured event. Thus a
`ProcessCreate` schedule stores its ProcessDef name and arguments inside that payload, not in
separate crontab columns. Changing a row registers, reschedules, or removes its Quartz job.

## Audit and process lineage

The trigger-specific `TriggerLog` in `trigger_log` is an idempotency ledger only.
It does not store process-create audit events or general-purpose category/phase
columns. Separate trigger-execution history retains start/end times, event payload,
source attributes, outcomes, and associated process IDs.

The trigger claim is persisted before synchronous event delivery and later marked completed or
failed. The standard `ProcessCreate` subscriber creates a root process from a required ProcessDef
name and arguments, linking its process ID to the trigger ID. The existing process service also
exposes this same operation at `POST /process`. Processes retain trigger, parent,
and predecessor lineage; separately persisted completion events connect downstream
processes. The management API and React dashboard expose these relationships,
execution timelines, and end-to-end traces. This history is separate from trigger
idempotency and durable outbox consumer receipts.

Tenant isolation uses the standard `x-chenile-tenant-id` header and the inherited
`BaseJpaEntity.tenant` column. `Process` does not maintain separate tenant or client fields.

## First-release scope

- `chenile-trigger` in `chenile-process-management`, with a trigger-only ledger;
- generic direct-event trigger service, with no CConfig mapping dependency;
- persistent Quartz crontab adapter;
- ProcessManager `ProcessCreate` subscriber, execution history, and process lineage.

File-watch and broker-message adapters will follow the same contract later.

The original [ADR-0001](https://github.com/rajakolluru/chenile-ppt/blob/main/adr/0001-chenile-trigger-framework.md)
includes an implementation update explaining the superseded generic logger design.
See the [2.1.31 release notes]({{ '/release-notes/2.1.31/' | relative_url }}) and
[runtime guide](https://github.com/ajapros/chenile-process-management/blob/main/docs/process-management.md)
for current behavior and operational constraints.
