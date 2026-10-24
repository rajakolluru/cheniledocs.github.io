---
layout: doc
title: "Process deployment, end to end: the p1 tutorial"
description: Build a durable splitter/aggregator deployment with Chenile — define processes, generate the server + worker mini-monoliths with JGen, implement three workers, and run it over Kafka. Walks the p1 sample start to finish.
permalink: /developer/process-deployment-tutorial/
---

# Process deployment, end to end: the p1 tutorial

This is the full picture of [Chenile process management](/developer/process-management/): take a long
splitter/aggregator job, declare it as data, let JGen generate a runnable **server + worker** deployment,
fill in three methods, and run it durably over Kafka. We build it with the checked-in **`p1`** sample — a
`batch` process that splits into `item`s, executes each item on a worker, and aggregates the results.

Three repositories meet here: the **runtime** (`chenile-process-management`), the **generator**
(`chenile-gen`, JGen 2.1.34), and the **sample** (`chenile-samples/p1`). You never hand-assemble the
deployment — the generator does — so most of this page is about the two things that are yours: the process
**definitions** and the worker **implementations**.

<div class="callout key"><div class="t">What you'll end up with</div>
Two runnable mini-monoliths — <code>p1Server</code> (state, outbox, triggers, definitions REST, service
registry) and <code>p1Worker</code> (a headless Kafka listener plus your worker JARs) — plus per-definition
worker modules. The server never runs business logic; the worker never touches the process database.</div>

## The shape of it

p1 is the **brain and the muscle**, split across two hosts and decoupled by one Kafka topic.

- **`p1Server`** (`http://localhost:8000`) owns the authoritative state: the [state machine](https://thefinito.org),
  the always-on [durable outbox](/developer/process-outbox/), the [trigger framework](/developer/trigger-framework/),
  the definitions REST service, cron, and the **service registry**. It *dispatches* work; it does not perform it.
- **`p1Worker`** (`http://localhost:8001`) is a headless host: a Kafka listener, `process-delegate`, and one
  worker JAR per process definition. It holds **no** process datasource and runs **no** outbox dispatcher.

The animation below walks a whole `batch` through the system — trigger → split → three items execute →
aggregate → complete. Play it, step through it, and keep it open as a map while you read the rest.

<iframe src="{{ '/assets/schematics/p1-process-deployment.html' | relative_url }}" title="Animated p1 process deployment schematic" style="width:100%;height:1360px;border:1px solid #223049;border-radius:14px;background:#0e1420;margin:14px 0;" loading="lazy"></iframe>

[Open the schematic full-screen]({{ '/assets/schematics/p1-process-deployment.html' | relative_url }}) (handy for screen-recording).

## Part 1 — Declare the processes

A deployment starts from **definitions as data**. p1's `processSpec` keeps the runtime's native `processMap`
shape: a two-level tree where `batch` is a non-leaf that splits into `item`s, and `item` is a leaf that does
the real work.

```json
{
  "processMap": {
    "batch": {
      "leaf": false,
      "args": "org.chenile.samples.p1.model.BatchIn",
      "config": { "queue": "process-work" },
      "inputFields": { "batchId": "string", "count": "int" }
    },
    "item": {
      "parentProcessType": "batch",
      "leaf": true,
      "args": "org.chenile.samples.p1.model.ItemIn",
      "config": { "queue": "process-work" },
      "inputFields":  { "itemId": "string", "index": "int" },
      "outputFields": { "processed": "boolean", "itemNumber": "long" }
    }
  }
}
```

- **`leaf`** decides the worker kind: a leaf gets an **executor**; a non-leaf gets a **splitter + aggregator**.
- **`parentProcessType`** builds the tree; **`inputFields`/`outputFields`** become typed DTOs (`BatchIn`,
  `ItemIn`, `ItemOutput`).
- **`config.queue`** is the Kafka topic a definition's work is published to (here both use `process-work`).
  Anything without a `queue` falls back to the blueprint's default `workTopic`.

Cron schedules live in a **separate** file (`cronSpec`), seeded disabled, read by `JsonCrontabRepository`:

```json
[ { "name": "daily-batch", "eventName": "ProcessCreate", "cronExpression": "0 0 2 * * ?",
    "timezone": "UTC", "enabled": false,
    "payload": { "processDefName": "batch", "args": { "batchId": "example" } } } ]
```

## Part 2 — Generate the deployment

The [`chenile-process-management`](/developer/jgen-blueprints/#process-management) JGen blueprint (2.1.35)
turns those two files into a runnable deployment. It is an **aggregated** blueprint: it composes `minimonolith`
(for the two hosts) and [`chenile-process-worker-set`](/developer/jgen-blueprints/#process-worker-set), which in
turn expands one worker module per process definition.

```sh
cd chenile-gen/jgen
jgen.sh -e oo -g chenile-process-management     # writes oo/input-file.json + sample spec files
cd oo && jgen.sh -f input-file.json             # generates output/p1
```

What comes out — the `p1` reactor:

| Module | Role |
| --- | --- |
| `p1-api` | shared typed payloads + process-start contracts |
| `p1-server-config` | native definitions (`defs.json`) + cron seeds — **server only** |
| `p1-server-service` | typed Chenile HTTP services, process bootstrap, acknowledged Kafka publication; **no** business workers |
| `p1-batch-workers` | the `batch` worker JAR — its API owns `BatchIn` and `AggregatedResult<ItemOutput>`; its service holds the **splitter + aggregator** |
| `p1-item-workers` | the `item` worker JAR — its API owns `ItemIn`/`ItemOutput`; its service holds the **executor** |
| `p1-worker-listener` | a **headless Chenile service** that subscribes to Kafka and routes each work message to the right worker bean, with a typed payload |
| `p1Server`, `p1Worker` | the two composed `minimonolith` hosts (the server uses one queue-based Kafka starter) |

The `p1-worker-listener` is itself generated as a headless service (`bluePrintName="chenile-headless-service"`),
a nice illustration of blueprints composing blueprints. Its body is empty — the routing is all declarative:

```java
@ChenileController(value = "processWork", serviceName = "_processWorkService_",
        serviceSelector = "processWorkServiceSelector",
        interfaceClass = WorkListenerService.class, bluePrintName = "chenile-headless-service",
        registerInServiceRegistry = false)
public class ProcessWorkListener {
    @EventsSubscribedTo({"process-work"})
    @ChenileOperation
    @BodyTypeSelector("processWorkBodyTypeSelector")
    public boolean accept(String processType, String workerType,
                          @ChenileBody WorkListenerInput<Object> input) { return true; }
}
```

Each Kafka message carries `processType` and `workerType` headers. The listener's
[service selector](/developer/runtime-internals/#choosing-the-implementation-per-request) turns them into a
bean name — `batch` + `SPLITTER` → **`batchSplitter`**, `item` + `EXECUTOR` → **`itemExecutor`** — and Chenile
calls that bean instead of the default. The body selector reads the chosen worker's generic type, so the
payload arrives as a real `BatchIn` or `ItemIn`, not a JSON string. (`_processWorkService_` is only a
fallback that fails loudly if no worker was selected.) **Worker bean names are therefore routing keys**:
p1 registers `batchSplitter`, `batchAggregator` and `itemExecutor`.

## Part 3 — Implement the three workers

This is the only code you write. The generated hooks return defaults until you supply domain logic.
Each extends a typed listener base from `process-delegate` that handles the delivery, the typed payload, the
tenant context and the callback to the server — you only implement `doStart`. Your input arrives as
`WorkListenerInput<T>`: the typed `payload` plus `processId`, `dispatchId` and the definition's `execDef`.

**The splitter** turns one `BatchIn` into N child payloads. `makeSubProcessPayload(childInput, childType)`
builds each one; the base class reports `splitDone` for you (or call `splitPartiallyDone` to submit batches as you go).

```java
public class BatchSplitter extends SplitterWorkListener<BatchIn, Object> {
    @Override protected List<SubProcessPayload> doStart(WorkListenerInput<BatchIn> input) {
        List<SubProcessPayload> payloads = new ArrayList<>();
        for (int i = 0; i < input.payload.count; i++)
            payloads.add(makeSubProcessPayload(new ItemIn(i), "item"));
        return payloads;
    }
}
```

**The executor** transforms one typed input into one typed output; the base class reports `doneSuccessfully`
(or `doneWithErrors` if you throw).

```java
public class ItemExecutor extends ExecutorWorkListener<ItemIn, ItemOutput> {
    @Override protected ItemOutput doStart(WorkListenerInput<ItemIn> input) {
        ItemOutput out = new ItemOutput();
        out.itemNumber = (long) input.payload.index;
        out.processed = true;
        return out;          // the generated stub returns an empty ItemOutput until you fill it in
    }
}
```

**The aggregator** folds each child's output into a consolidated result. Chenile ships
`AggregatedResult<ChildOutput>` (outputs + errors + counts) in `process-delegate`, so you don't have to invent
an aggregate model — `doStart` is called once per child, progressively enhancing the result:

```java
public class BatchAggregator
        extends AggregatorWorkListener<BatchIn, AggregatedResult<ItemOutput>, ItemOutput> {
    @Override protected AggregatedResult<ItemOutput> doStart(AggregatedResult<ItemOutput> out,
            WorkListenerInput<BatchIn> input, ItemOutput childOutput, Process child) {
        if (out == null) out = new AggregatedResult<>();
        if (child.errors == null || child.errors.isEmpty()) out.completedChildren++;
        else { out.failedChildren++; /* collect child.errors into out.errors */ }
        if (childOutput != null) out.outputs.add(childOutput);
        return out;
    }
}
```

That's the whole application. Everything else — dispatch, durability, retries, idempotency, tenant
propagation, callbacks — is generated or lives in the runtime.

## Part 4 — How one batch flows (the runtime)

Match these to the steps in the animation above. The key property: **every consequence of a state change is
durable**, written in the same transaction as the state, and executed after commit.

1. **Trigger accepted.** Cron (or `POST /trigger`) commits a durable `DISPATCH_TRIGGER` command and returns
   `202 Accepted` with a `Location` — before any work runs.
2. **batch created.** The dispatcher replays the trigger as `ProcessCreate`; `ProcessManager` persists the
   root `batch` and enters the state machine (`SPLIT_PENDING`).
3. **Consequence recorded.** In the *same transaction* that saves the process, a `START_WORKER (SPLITTER)`
   row is written to the [durable outbox](/developer/process-outbox/).
4. **Published to Kafka.** The outbox poller hands the work to the queue-based starter, which publishes a
   `WorkListenerInput` envelope — `processId`, `dispatchId`, the process input as `payload`, and `execDef` — to
   `process-work`. The headers carry `processType=batch`, `workerType=SPLITTER`, the process's tenant as
   `x-chenile-tenant-id`, and any other `x-` context headers; internal transport props are dropped.
5. **Delivered + dispatched.** p1Worker's listener consumes it (group `p1-workers`). The service selector picks
   **`batchSplitter`**, the body selector types the payload as `BatchIn`, and your `BatchSplitter` runs with the
   tenant restored in its context.
6. **splitDone callback.** The splitter returns three `ItemIn`s; `process-delegate` discovers `processService`
   through the **service registry** and calls `splitDone` back on the server. `batch` → `SUB_PROCESSES_PENDING`.
7. **Items execute.** The server creates three `item` children (`EXECUTING`) and enqueues one
   `START_WORKER (EXECUTOR)` each — out over Kafka, dispatched to `ItemExecutor`, `doneSuccessfully` back.
8. **Parent advances.** `SIGNAL_PARENT` counts each child exactly once (receipt-guarded); when all three are
   done and the split is finalized, `batch` → `AGGREGATION_PENDING`.
9. **Aggregate + complete.** A `START_WORKER (AGGREGATOR)` runs `BatchAggregator`; `aggregationDone` drives
   `batch` → `PROCESSED`, and `EMIT_COMPLETED` publishes `ProcessCompleted` (chaining any successor).

Because delivery is at-least-once, a work message can arrive twice — the server's three idempotency guards
(unique enqueue key, claim-token fencing, and effect-level receipts) make that safe: a replayed child cannot
be double-counted and a replayed completion cannot create duplicate successors.

**When something fails, it matters what failed.**

- **Your worker throws.** That's a *business* failure: the listener reports it to the server as
  `splitDoneWithErrors`, `doneWithErrors` or `aggregationDoneWithErrors` (with the message, stack trace and any
  structured `ErrorNumException` errors). The process records it and ends `PROCESSED_WITH_ERRORS` — the message is
  acknowledged, not retried, because re-running the same input would just fail again.
- **The callback fails, or the message is malformed** (no process id, no process type, a worker-type mismatch,
  no tenant). That's an *infrastructure* failure: the exception propagates, Chenile Kafka's consumer retries with
  a bounded policy, and exhausted messages land on the dead-letter topic `process-work.DLT` instead of blocking
  the partition or being lost.

There is no separate server-side Kafka publisher to coordinate — the server only publishes through the durable
outbox, and the worker side owns delivery, retry and dead-lettering.

## Part 5 — Run it

```sh
cd output/p1 && mvn install        # KafkaBaseTest tests use Testcontainers — Docker must be running

export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
export PROCESS_MANAGEMENT_API_KEY="$(openssl rand -hex 32)"

./run-server.sh      # p1Server on :8000 — registers processService
# then, in another terminal:
./run-workers.sh     # p1Worker on :8001 — joins consumer group p1-workers
```

Start Kafka first and create the `process-work` and `process-work.DLT` topics. The worker binds the topic with
`chenile.kafka.consumer.topic-bindings[process-work]=process-work`. Worker replicas share the `p1-workers` group
(override with `PROCESS_WORK_CONSUMER_GROUP`), so scaling the worker is just running more instances — the broker
spreads the work messages across them. Kick off a run with a trigger:

```sh
curl -X POST http://localhost:8000/trigger \
  -H "X-Process-Management-Key: $PROCESS_MANAGEMENT_API_KEY" -H "x-chenile-tenant-id: default" \
  -H "Content-Type: application/json" \
  -d '{"eventId":"ProcessCreate","payload":{"processDefName":"batch","args":{"batchId":"b1","count":3}}}'
```

## Part 6 — Observe it

Everything is visible through the server's [management API and the process-ui console](/developer/process-admin/):

- `GET /process-management/api/processes` — the live process tree with child and successor drill-downs.
- `GET /process-management/api/executions` — trigger history (a filtered view of `DISPATCH_TRIGGER` rows).
- `GET /process-management/api/trace?processId=…` — the causal graph from the first trigger through completion.
- The generated server exposes the **H2 console** in dev, so you can watch `chenile_process_outbox`,
  `chenile_process_receipt` and `process_table` fill and drain.

## Why this shape holds up

- **Durable where it counts, disposable where it helps.** The server keeps the state, outbox and receipts;
  the worker is stateless and can crash, redeploy or scale to zero without losing the orchestration record.
- **Exactly-once effects over at-least-once transport.** The outbox + receipts give exactly-once *effects*
  even though Kafka delivery is at-least-once; your workers only need their own dedup for external side effects.
- **Scale the muscle, not the brain.** Add worker replicas (same group) or route heavy process types to their
  own topic and pool. The one server is replicated for availability, not throughput.
- **Multi-tenant throughout.** `x-chenile-tenant-id` rides the whole cascade — message, worker context and
  callback. The starter stamps each work message with its process's tenant, and the listener refuses work that
  arrives without one.

## Where to go next

- The runtime internals: the [process management guide](/developer/process-management/), the
  [durable outbox](/developer/process-outbox/), and the [trigger framework](/developer/trigger-framework/).
- The generator: the [JGen blueprint reference](/developer/jgen-blueprints/) — the
  `chenile-process-management`, `chenile-process-worker-set` and `chenile-process-workers` blueprints plus the composition engine.
- Operating it: the [management API and admin console](/developer/process-admin/).
- The comparison that frames the design: [Chenile vs Temporal](/developer/process-vs-temporal/).
