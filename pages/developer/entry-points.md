---
layout: doc
title: Beyond HTTP — alternate entry points
description: The same Chenile service can be triggered by an event, a cron schedule, or a dropped file — without rewriting it. Event processors, the scheduler, file-watch and cache.
permalink: /developer/entry-points/
---

# Beyond HTTP — alternate entry points

A Chenile service is [protocol-agnostic](/concepts/07-messaging-abstraction/): the same operation, running behind the same [interception pipeline](/concepts/10-owiz/), can be reached by an HTTP request, an in-VM proxy call, a message — or by the entry points below. You write the service once; the trigger is a deployment choice.

## Event processors

Because every trigger is normalized into a `ChenileExchange`, a service can act as an **event processor** with no extra code: subscribe it to a topic (`@EventsSubscribedTo`) and inbound messages run the same operation and policies an HTTP call would. This is the foundation the scheduler, file-watch and process workers all build on.

## Scheduler (`chenile-scheduler`)

`chenile-scheduler` runs Chenile operations on a **cron schedule** using Quartz, and can dispatch each firing either locally or as a Kubernetes Job:

- **Cron** — each `SchedulerInfo` carries a `cronSchedule`; `SchedulerBuilder` wires it into Quartz (`cronSchedule(...)`).
- **Local or Kubernetes** — a `ScheduledTaskDispatcher` fans a firing to a `LocalChenileTaskLauncher` (in-process) or to a Kubernetes **Job** for isolated, scalable execution.
- **Execution history** — every run is recorded via a `SchedulerExecutionStore` (`JdbcSchedulerExecutionStore`) as `ScheduledExecutionRecord`s, with an execution status and a **concurrency policy** so overlapping firings behave predictably.

The result: scheduled work is a first-class Chenile service — interceptors, tenancy and logging apply — with durable execution records for operations to audit.

## File-watch (`chenile-filewatch`)

`chenile-filewatch` watches folders for completed input files and publishes each parsed record into the event pipeline — for integrations where an upstream system drops a data file.

- A companion **`.header` file is the completion marker**: the data file may be copied first, and the watcher only processes once the `.header` arrives containing `last.property`. This avoids reading half-written files.
- Configure the source/processed/error folders, the poll interval and a stability check:

```properties
chenile.file.watch.json.package=classpath*:filewatch/*.json
chenile.file.watch.source.folder=/data/in
chenile.file.watch.dest.folder=/data/processed
chenile.file.watch.error.folder=/data/error
chenile.file.watch.polltime.seconds=1
chenile.file.watch.stability-check-delay-ms=250
chenile.file.watch.scan-existing-on-startup=true
```

Import `FileWatchConfiguration` alongside your normal Chenile configuration; each parsed record flows through the pipeline like any other event.

## Cache (`chenile-cache`)

`chenile-cache` provides caching support for Chenile services — another auxiliary capability in `chenile-others`, alongside file-watch, the scheduler and the config maven plugin.

<div class="callout key"><div class="t">One service, many doors</div>
Event, schedule, file drop or HTTP — the trigger changes, the service and its policies don't. That's what lets Chenile act as an in-VM message bus that also speaks HTTP, cron and the file system.</div>
