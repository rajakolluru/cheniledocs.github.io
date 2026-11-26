---
layout: doc
title: "Beyond HTTP: events, schedules and file watch"
description: Other than HTTP, Chenile treats everything as an event. How schedules, file watch, messaging and code raise Chenile events, and how operations subscribe to them.
permalink: /developer/entry-points/
---

# Beyond HTTP: events, schedules and file watch

A Chenile service is [protocol-agnostic](/concepts/07-messaging-abstraction/): the same operation, behind the same
[interception pipeline](/concepts/10-owiz/), can be reached by an HTTP request, an in-VM proxy call, an MCP tool call
or an event. Each arrives through a transport adapter that calls `ChenileEntryPoint`; see [How it works](/how-it-works/).
**Other than HTTP, Chenile treats everything as an event.** A schedule coming due, a file landing in a folder and a
message on a topic each raise a Chenile event, and the operations that subscribe to it run. The concept is explained
in [Everything but HTTP is an event](/concepts/17-events/); this page is the developer's reference.

<span class="pill">{{ site.maven_version }}</span> Release status: the model on this page arrives in Chenile 2.1.36,
which is prepared for release with Maven Central publication pending. See the [2.1.36 release notes](/release-notes/2.1.36/).

## Subscribing to an event

```java
@PostMapping("/scheduled-report/generate")
@EventsSubscribedTo("scheduledReport")
public ResponseEntity<GenericResponse<ScheduledReportResult>> generate(
        HttpServletRequest request, @RequestBody ScheduledReportRequest body) {
    return process(request, body);
}
```

In a JSON service definition, the same is `"eventSubscribedTo": ["scheduledReport"]` on the operation. The payload
is converted to the operation's body type by the transformer, exactly as for an HTTP body. To see what raised the
event, bind the [standard headers](/concepts/17-events/#the-headers-every-event-carries) as `HEADER` parameters, or
take all of them with a `HEADERS` parameter.

## Raising an event from code: `TriggerService`

`chenile-trigger` (in chenile-core) holds the contract every internal source uses:

```java
TriggerInput input = new TriggerInput();
input.eventId = "scheduledReport";
input.payload = "{\"reportName\":\"daily-sales\"}";
input.idempotencyKey = "report:daily-sales:2026-06-23"; // optional: a repeat is ignored
input.headers.put("x-chenile-tenant-id", "acme");        // headers must start with x-
TriggerResult accepted = triggerService.trigger(input);
```

The default implementation, `DirectTriggerService`, raises the event at once and returns when every subscriber has
finished; a subscriber failure is thrown back to the caller and its key is released for a retry. Deduplication and
status (`triggerService.status(id)`) are kept in memory on the node for `chenile.trigger.dedupe.retention` (ISO-8601,
default `PT24H`), up to `chenile.trigger.dedupe.max-entries` (default 100000). With process management's
`trigger-service` on the class path, the durable [trigger framework](/developer/trigger-framework/) replaces it.

## Schedules

`chenile-scheduler` fires an event on a Quartz cron expression. A schedule is a `SchedulerDefinition`:

| Field | Meaning |
|---|---|
| `id` | stable identity; also the Quartz job key |
| `name`, `description` | for people and the console |
| `cronExpression` | Quartz syntax, with seconds (`0 0 2 * * ?` is 2 am daily) |
| `timezone` | defaults to UTC |
| `eventId` | the event to fire |
| `payload` | the event body, as JSON text |
| `headers` | extra headers, each starting with `x-` |
| `tenant` | the tenant the event fires as |
| `enabled` | a disabled schedule is kept but not scheduled |

Schedules come from three places, all held by one `ChenileScheduler`:

- **JSON files**, one schedule per file, found through `chenile.scheduler.json.package`:

  ```json
  {
    "id": "daily-report",
    "cronExpression": "0/30 * * * * ?",
    "eventId": "scheduledReport",
    "payload": "{ \"reportName\": \"daily-sales\", \"businessDate\": \"2026-06-23\" }"
  }
  ```
- **Code**: `chenileScheduler.schedule(definition)` and `unschedule(id)`. In a cluster, schedule from code on every
  node, for example at startup.
- **The database**, with `chenile-scheduler-db`: `POST /schedule`, `GET /schedule`, `GET /schedule/{id}` and
  `DELETE /schedule/{id}`, scoped to the caller's tenant. Changes are scheduled after the transaction commits, and
  every stored schedule is scheduled at startup. The host scans the entity and repository (package
  `org.chenile.scheduler.db`); the Liquibase changelog is `db/changelog/chenile-scheduler-db.changelog.xml`, context
  `chenile-scheduler-db`.

Ids must be unique across all three: two JSON files with the same id, or a stored id that is also in JSON, stop
startup. Each fire calls the `TriggerService` with source `CRON`, the idempotency key
`schedule:<id>:<scheduled fire time>` and the headers `x-chenile-schedule-id`, `x-chenile-scheduled-fire-time` and
`x-chenile-fire-time`.

**Several nodes.** Quartz is Spring Boot's (`spring.quartz.*`): in memory by default, so every node fires every
schedule and the idempotency key lets only one fire through per scheduled time. To fire on exactly one node, use
Quartz's clustered JDBC job store (`spring.quartz.job-store-type=jdbc`,
`spring.quartz.properties.org.quartz.jobStore.isClustered=true`) and create its tables with the `chenile-quartz`
Liquibase changelog. A Quartz job holds only the schedule id; the node that fires it reads the definition, from the
database first when chenile-scheduler-db is present.

## File watch

`chenile-filewatch` watches folders for completed input files and raises one event per record.

- A companion **`.header` file is the completion marker**: the data file may be copied first, and the watcher
  processes it only once the `.header` arrives containing `last.property`. This avoids reading half-written files.
- The header's `x-` properties become event headers; the others (`actual.file`, `actual.file.encoding`) go into the
  trigger context.
- Each record calls the `TriggerService` with source `FILE`, the definition's `eventId` (it defaults to the
  `fileWatchId`), the idempotency key `file:<fileWatchId>:<file name>:<sha256 of the file>:<record index>` and the
  headers `x-chenile-file-watch-id`, `x-chenile-file-name` and `x-chenile-record-index`. A file processed again after
  a crash raises nothing new; a changed file with the same name is new.
- With `DirectTriggerService` a subscriber failure moves the files to the error folder. With the durable trigger
  service the files are processed once every record is accepted, and failures are retried by the trigger layer.

```json
{ "fileWatchId": "orders", "eventId": "orderReceived",
  "recordClass": "com.example.orders.OrderLine", "dirToWatch": "orders" }
```

```properties
chenile.file.watch.json.package=classpath*:filewatch/*.json
chenile.file.watch.source.folder=/data/in
chenile.file.watch.dest.folder=/data/processed
chenile.file.watch.error.folder=/data/error
chenile.file.watch.polltime.seconds=1
chenile.file.watch.stability-check-delay-ms=250
```

## Messaging

A message received on a topic raises a Chenile event too. The Kafka consumer maps topics to event ids with
`chenile.kafka.consumer.topic-bindings` (by default the event id is the topic name), and failed messages are retried
and then sent to the dead-letter topic. Messaging raises its events directly rather than through the
`TriggerService`, because the broker is already the durable, retrying layer. See
[messaging transports](/developer/messaging-transports/).

## Cache (`chenile-cache`)

`chenile-cache` provides caching support for Chenile services, another auxiliary capability in `chenile-others`.

<div class="callout key"><div class="t">One service, many doors</div>
HTTP calls an operation; everything else raises an event that operations subscribe to. The schedule, the file and
the topic are configuration, so the same subscriber can be driven by any of them without a change to its code.</div>
