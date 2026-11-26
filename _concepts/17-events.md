---
title: "Everything but HTTP is an event"
short: "Chenile events"
order: 17
summary: "Chenile has two front doors. HTTP calls an operation directly. Everything else (a file landing in a folder, a cron schedule coming due, a message arriving on a topic, a trigger raised from code) becomes a Chenile event, and operations subscribe to events. The Chenile event is internal; external events are mapped onto it."
---

## Two front doors

A Chenile operation can be reached in two ways.

- **HTTP.** A request to a URL runs one operation. The caller knows which operation it wants.
- **An event.** Something happens, and every operation that subscribes to that happening runs. The source does not
  know, or care, who is listening.

**Other than HTTP, Chenile treats everything as an event.** A file arriving, a schedule coming due, a message on a
Kafka topic, a trigger raised from code or posted to `/trigger`: each becomes a *Chenile event*, and from there on
they are all the same thing. The same [interception pipeline](/concepts/10-owiz/) runs, the same policies apply,
and the payload is converted to the subscriber's input type the same way.

<div class="callout key">
  <div class="t">The Chenile event is internal</div>
  A Chenile event is a name (the event id), a payload and a set of headers, raised inside the application. It is
  not a Kafka message, a file or a cron entry. Those are <em>external</em> events, and Chenile maps each of them
  onto an internal event: a file watcher being activated, a cron schedule becoming active, or a message being
  received on a topic all raise a Chenile event that your operations subscribe to.
</div>

## Subscribing

An operation subscribes to an event id, either with an annotation on the controller method:

```java
@PostMapping("/scheduled-report/generate")
@EventsSubscribedTo("scheduledReport")
public ResponseEntity<GenericResponse<ScheduledReportResult>> generate(
        HttpServletRequest request, @RequestBody ScheduledReportRequest body) {
    return process(request, body);
}
```

or with `"eventSubscribedTo": ["scheduledReport"]` on the operation in a JSON service definition. The operation
above keeps its HTTP door too: it runs on `POST /scheduled-report/generate` and whenever `scheduledReport` is
raised.

Several operations may subscribe to one event, and one operation may subscribe to several events. The operation
never learns what raised the event, unless it chooses to read the [standard headers](#the-headers-every-event-carries).

## Mapping external events onto Chenile events

| External event | What maps it | Configured as |
|---|---|---|
| A cron schedule becomes due | [chenile-scheduler](/developer/entry-points/#schedules) | `eventId` on a schedule (JSON file, code, or the database with chenile-scheduler-db) |
| A file lands in a watched folder | [chenile-filewatch](/developer/entry-points/#file-watch) | `eventId` on a file watch definition (defaults to the file watch id); one event per record |
| A message arrives on a topic | [chenile-messaging](/concepts/07-messaging-abstraction/) (Kafka, MQTT, Azure, in-JVM) | `chenile.kafka.consumer.topic-bindings` maps a Kafka topic to an event id (by default the event id is the topic); `chenile.mqtt.topic-bindings` does the same for MQTT (opt-in) |
| A trigger is posted | `POST /trigger` | the `eventId` in the request |
| Code raises it | `TriggerService.trigger(...)` | the `eventId` on `TriggerInput` |

Because the mapping is configuration, the same subscriber can be driven by a nightly schedule in one deployment, a
dropped file in another and a Kafka topic in a third, without a change to its code.

## One door for internal sources: the TriggerService

The scheduler, file watch and the `/trigger` endpoint all raise their events through one contract,
`TriggerService` (module `chenile-trigger`, in chenile-core). It gives every source the same rules:

- **An idempotency key per source.** A schedule uses `schedule:<id>:<scheduled fire time>`, a file record uses
  `file:<file watch id>:<file name>:<sha256 of the file>:<record index>`. A repeated key is ignored, so a schedule
  fired by two nodes, or a file reprocessed after a crash, raises its events once.
- **Tenant rules.** The tenant comes from the caller's context or the source's configuration, and a caller cannot
  raise an event for another tenant.
- **A trigger id and a status** for every accepted trigger.

There are two implementations, and Chenile picks one for you:

| Implementation | Where | What it does |
|---|---|---|
| `DirectTriggerService` | chenile-trigger (default) | Raises the event straight away, in the caller's thread. Deduplication and status are kept in memory on the node. |
| `EventTriggerService` | process management's `trigger-service` | Records the trigger in the durable outbox first, then dispatches it with retries; a trigger that keeps failing ends as DEAD. Deduplicates across nodes. |

Add `trigger-service` to a deployment and every scheduled fire and file record becomes durable, with no change to
the schedules, the file watches or the subscribers. See the [trigger framework](/developer/trigger-framework/).

Messaging is the exception: a consumer raises its event directly, because the broker already retries and dead-letters
failed messages (Kafka's `.DLT` topics).

## The headers every event carries

| Header | Set by | Value |
|---|---|---|
| `x-chenile-event-source` | the trigger service | `CRON`, `FILE`, `API` or `EXTERNAL` |
| `x-chenile-trigger-id` | the trigger service | the accepted trigger's id; callers cannot choose it |
| `x-chenile-tenant-id` | every source | the tenant |
| `x-chenile-schedule-id`, `x-chenile-scheduled-fire-time`, `x-chenile-fire-time` | the scheduler | which schedule fired, and when |
| `x-chenile-file-watch-id`, `x-chenile-file-name`, `x-chenile-record-index` | file watch | which file and record |

A subscriber binds any of them as a `HEADER` parameter, or takes them all with a `HEADERS` parameter.

## What subscribers own

An event says *something happened*. Deciding what that means is the subscriber's job:

- **Not overlapping with a previous run.** Only the subscriber knows when its work is finished.
- **Doing the heavy work elsewhere.** A subscriber can do the work inline, enqueue idempotent work items for a pool
  of workers, start a [process](/developer/process-management/), or launch a Kubernetes Job. The
  [scheduler sample](https://github.com/ajapros/chenile-samples/tree/main/scheduler-sample) enqueues work items that
  KEDA-scaled workers process.
- **Its own idempotency for external systems.** The trigger layer raises each event once per key; with the durable
  trigger service a failed attempt may run again.

<div class="callout"><span class="pill">{{ site.maven_version }}</span> The unified event model (schedules and file
watch firing events through the TriggerService, chenile-trigger, chenile-scheduler-db) arrives in Chenile 2.1.36.
See the <a href="/release-notes/2.1.36/">2.1.36 release notes</a>.</div>
