---
title: "Process Management — the full picture"
order: 13
duration: "6 min"
video_length: "3:27"
youtube_id: "CWmlKTj70LI"
summary: "The whole of Chenile Process Management in one go, through the p1 sample: declare your processes as data, generate a server-plus-worker deployment with jgen, implement three methods, and watch a batch split, execute and aggregate — durably, over Kafka."
---

**Episode goal:** show process management end to end — the brain/muscle split, declaring processes as data, generating the deployment, the three worker methods you write, the durable loop, exactly-once guarantees, and running it. Built around the [process deployment tutorial](/developer/process-deployment-tutorial/) and the **p1** sample.

<div class="script">
  <div class="beat k">Cold open — the problem</div>
  <div class="beat v"><strong>On screen:</strong> one box straining, then fanning into many sub-jobs, then a crash. Voiceover: “Some work doesn’t fit a single request. A long job fans out into many, done only when all of them finish — and the naive way, a crash halfway strands everything. Chenile declares it as data, generates the plumbing, and survives the crash.”</div>

  <div class="beat k">The brain and the muscle</div>
  <div class="beat v"><strong>On screen:</strong> a calm server box (state machine · outbox · triggers) and a busy worker box (stateless). Voiceover: “Split the work in two. A brain that owns the state and never loses it; a muscle that does the work, stateless, run as many as you like. In p1 that’s two deployables — one server, one worker — with one Kafka topic and a callback between them.”</div>

  <div class="beat k">Declare it as data</div>
  <div class="beat v"><strong>On screen:</strong> <code>defs.json</code> — <code>batch</code> (non-leaf) and <code>item</code> (leaf). “Leaf or not decides the worker: a leaf executes, a non-leaf splits and aggregates. Typed fields become typed objects. Each definition names its Kafka topic. Cron lives in its own file, seeded off.”</div>

  <div class="beat k">Generate the deployment</div>
  <div class="beat v"><strong>Demo:</strong> <code>jgen.sh -g chenile-process-management</code> then the generated <code>output/p1/</code> reactor. “One blueprint composes smaller ones — a server, a headless Kafka worker-listener, one worker JAR per definition, and two mini-monoliths. The server holds the state and ships no business logic.”</div>

  <div class="beat k">Three methods</div>
  <div class="beat v"><strong>On screen:</strong> <code>BatchSplitter</code>, <code>ItemExecutor</code>, <code>BatchAggregator</code>. “The only code you write. The splitter makes a typed payload per child; the executor turns input into output; the aggregator folds children into <code>AggregatedResult&lt;ItemOutput&gt;</code>, which Chenile ships. Three methods — no dispatch, no retries, no plumbing.”</div>

  <div class="beat k">The durable loop</div>
  <div class="beat v"><strong>On screen:</strong> the animated schematic, step by step. “A trigger commits durably and returns 202 before any work runs. The batch enters the state machine; its next step is written to the outbox in the same transaction. A poller publishes to Kafka; the worker runs your splitter and calls back through the registry. Three items execute over the same loop, then the batch aggregates, reaches PROCESSED, and emits completion.”</div>

  <div class="beat k">Exactly-once, crash-proof</div>
  <div class="beat v"><strong>Lower third:</strong> at-least-once in, exactly-once out. “Kafka can deliver twice. Three guards — a unique enqueue key, claim-token fencing, and effect-level receipts — make the effects exactly-once: a replayed child counts once, a replayed completion makes no duplicate. Crash the worker and nothing is lost. State and its consequences commit together, or not at all.”</div>

  <div class="beat k">Run it and watch it</div>
  <div class="beat v"><strong>Demo:</strong> <code>./run-server.sh</code>, <code>./run-workers.sh</code>, then <code>curl -X POST /trigger</code>. “Start the server, then the worker — it joins a consumer group, so more throughput is just more workers. Fire a batch with one call, watch the tree fill in process-ui, and query every causal edge with <code>/trace</code> while the outbox drains in the H2 console.”</div>

  <div class="beat k">Recap</div>
  <div class="beat v">“A brain, a muscle, one topic — declared as data, durable by default. The full <a href="/developer/process-deployment-tutorial/">tutorial</a> and the p1 sample take it further. Go build one.”</div>
</div>
