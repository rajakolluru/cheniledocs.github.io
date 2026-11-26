---
layout: doc
title: Trigger framework architecture
description: The TriggerService contract, the in-memory and durable implementations, outbox dispatch, status queries and process correlation.
permalink: /developer/trigger-framework/
---

# Trigger framework architecture

Every internal source of a [Chenile event](/concepts/17-events/) (the scheduler, file watch, the `/trigger`
endpoint and your own code) raises it through one contract, `TriggerService`, from the `chenile-trigger` module in
chenile-core. There are two implementations, and Chenile picks one automatically.

<span class="pill">{{ site.maven_version }}</span> Release status: chenile-trigger, and the scheduler and file watch
firing through it, arrive in Chenile 2.1.36, which is published to Maven Central.

| | `DirectTriggerService` | `EventTriggerService` |
|---|---|---|
| Module | `chenile-trigger` (chenile-core) | `trigger-service` (chenile-process-management) |
| Used when | no other `TriggerService` exists (auto-configuration) | `trigger-service` is on the class path |
| Raises the event | at once, in the caller's thread | later, from the shared outbox dispatcher |
| A failure | is thrown to the caller; the key is released for a retry | is retried; a trigger that keeps failing ends as DEAD |
| Deduplication | in memory, on this node, for a limited time | durable, across nodes |
| Status | in memory: RUNNING, DONE or FAILED | from the outbox: PENDING, RUNNING, DONE or DEAD |

Both apply the same input rules (shared in `TriggerRequests`): an event id is required, headers must start with
`x-`, the tenant must match the caller's, any incoming `x-chenile-trigger-id` is dropped, and
`x-chenile-event-source` is set from the input's source.

## Durable acceptance and identity

POST /trigger accepts eventId, the original payload, x-prefixed headers, generic triggerContext,
triggerTime and an optional idempotencyKey. With `EventTriggerService` it commits acceptance before returning
HTTP 202. The Chenile response payload contains only `{"triggerId":"<outbox-id>"}`. No event is invoked during
submission. The Location header and GET /trigger/{id} provide tenant-scoped status queries.
`TriggerResult` implements Chenile's `ResponseHeadersAware` contract to expose that header;
`@ChenileResponseCodes(success = 202, warning = 202)` supplies the status. The header metadata is excluded from
the JSON payload.

The outbox ID is the trigger ID. Dispatch sets `x-chenile-trigger-id` to this ID, and a resulting process records
it for correlation. Retry keys are separate: the same tenant/event/key returns the original acknowledgement,
including after failure. Without a key, every submission is a new trigger. There is no separate trigger table.

## Execution and recovery

The shared dispatcher claims the command, restores x-headers and tenant context, and passes the
payload unchanged to EventProcessor. Chenile's transformation pipeline selects the subscriber's
input type. Invocation output is logged only. Local subscriber changes and DONE acknowledgement
commit together. A rolled-back attempt may run again; external systems need their own idempotency.

Status progresses through PENDING, RUNNING, DONE or DEAD. Failures retry with the shared outbox
lease, fencing and backoff rules. A missing subscriber is a failure. Preserve trigger command
identities and decodable envelopes so status and duplicate suppression survive retention cleanup.

## Schedules, files and process lineage

The scheduler and file watch do not know which implementation they call. A schedule fires with source `CRON`, the
key `schedule:<id>:<scheduled fire time>` and the schedule headers; a file record with source `FILE`, the key
`file:<fileWatchId>:<file name>:<sha256>:<record index>` and the file headers. So in a deployment with
`trigger-service`, every scheduled fire and file record is accepted durably and retried, and in a cluster a fire
from two nodes is accepted once. See [schedules and file watch](/developer/entry-points/).

Processes keep trigger, parent and predecessor correlation. Completion and chaining use terminal
process state and transactional receipts; no separate completion-event snapshot is required.
The management API and React dashboard read trigger history from DISPATCH_TRIGGER commands and filter it by
schedule through the `x-chenile-schedule-id` header.
