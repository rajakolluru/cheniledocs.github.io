---
layout: doc
title: Trigger framework architecture
description: Durable trigger acceptance, shared outbox dispatch, status queries, and process correlation.
permalink: /developer/trigger-framework/
---

# Trigger framework architecture

Trigger sources submit event invocations into the shared `chenile-outbox` infrastructure. The
trigger API remains independent of cron and process management. There is no separate trigger table.

## Acceptance and identity

POST /trigger accepts eventId, the original payload, x-prefixed headers, generic triggerContext,
triggerTime and an optional idempotencyKey. It commits acceptance before returning HTTP 202. The
Chenile response payload contains only `{"triggerId":"<outbox-id>"}`. No event is invoked during submission.
The Location header and GET /trigger/{id} provide tenant-scoped status queries.
`TriggerResult` implements Chenile's `ResponseHeadersAware` contract to expose that header;
`@ChenileResponseCodes(success = 202, warning = 202)` supplies the status. The controller simply
calls `process(...)`, with no special header construction or response-body code rewriting.
The header metadata is excluded from the JSON payload.

The outbox ID is the trigger ID. Dispatch sets x-chenile-trigger-id to this ID, and a resulting process
records it for correlation. Retry keys are separate: the same tenant/event/key returns the original
acknowledgement, including after failure. Without a key, every submission is a new trigger.

## Execution and recovery

The shared dispatcher claims the command, restores x-headers and tenant context, and passes the
payload unchanged to EventProcessor. Chenile's transformation pipeline selects the subscriber's
input type. Invocation output is logged only. Local subscriber changes and DONE acknowledgement
commit together. A rolled-back attempt may run again; external systems need their own idempotency.

Status progresses through PENDING, RUNNING, DONE or DEAD. Failures retry with the shared outbox
lease, fencing and backoff rules. A missing subscriber is a failure. Preserve trigger command
identities and decodable envelopes so status and duplicate suppression survive retention cleanup.

## Cron and process lineage

`crontab-trigger` depends only on trigger-api. Quartz schedules remain in chenile_crontab. A firing
uses schedule ID and Quartz fire identity as a submission key; the acknowledged trigger ID is
assigned separately. Cron metadata and all configured/generated x-headers are triggerContext JSON.
The scheduler passes eventPayloadJson unchanged; subscriber conversion validates the event body.

Processes keep trigger, parent and predecessor correlation. Completion and chaining use terminal
process state and transactional receipts; no separate completion-event snapshot is required.
The management API and React dashboard read trigger history from DISPATCH_TRIGGER commands.
