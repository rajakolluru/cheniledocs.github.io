---
layout: doc
title: Process management
description: Orchestrate long-running parent/child processes — map-reduce style — with pluggable worker launch modes, from the chenile-process-management repo.
permalink: /developer/process-management/
---

# Process management

Some work doesn't fit a single request/response: a long-running job that fans out into many sub-jobs and can only be marked complete once **all** of them finish. `chenile-process-management` is the orchestrator for exactly this — the classic **map-reduce / [splitter-aggregator](/concepts/10-owiz/)** pattern, made durable and observable.

## What it does

A **process orchestrator** breaks a problem into smaller problems, kicks off a sub-process for each, and tracks them until every one completes — only then is the overall process marked done. The whole shape is described in a **JSON file**, so you control the decomposition declaratively rather than in code.

The repo is organized as `process-api`, `process-service`, `process-delegate`, `process-utils`, plus the pluggable **starters** below.

## Choose how workers run

The framework supports three worker launch modes — the same process definition, different execution substrate:

<div class="grid-3" style="margin:1.4em 0">
  <div class="card">
    <div class="ic">⚡</div>
    <h3><code>invm-process-starter</code></h3>
    <p>Posts work to the in-VM event processor. Ideal for unit tests and simple local flows — no broker, no database.</p>
  </div>
  <div class="card">
    <div class="ic">📨</div>
    <h3><code>q-based-process-starter</code></h3>
    <p>Publishes work to Chenile <a href="/concepts/07-messaging-abstraction/">pub/sub</a>. Use it when a message broker is your platform standard.</p>
  </div>
  <div class="card">
    <div class="ic">🗄️</div>
    <h3><code>jdbc-process-starter</code></h3>
    <p>Persists work into <code>chenile_process_work_item</code> so workers scale off a database backlog — e.g. autoscaled with <b>KEDA</b>.</p>
  </div>
</div>

## Reliable failure reporting

As of [2.1.30](/release-notes/2.1.30/), worker payload failures are **reported to the process daemon** rather than silently logged while the worker reports success. A malformed payload, an incompatible known-field type, a missing payload type, or a worker invocation failure now completes the matching work item **as an error** — so a run can no longer sit indefinitely in a pending state with no error record. Unknown JSON properties are tolerated (additive producer evolution), but known properties with incompatible types still fail and are reported.

<div class="callout key"><div class="t">Operational upshot</div>
A previously silent stalled run becomes an <strong>observable failed work item</strong>. Point your monitoring at process errors, and test a controlled malformed payload in non-production to confirm the daemon error event and worker log appear.</div>

## Where it fits

Process management builds on the same primitives as the rest of Chenile: [Owiz](/concepts/10-owiz/) provides the splitter-aggregator, [messaging](/concepts/07-messaging-abstraction/) carries queued work, and a service operation does the unit of work. Generate a starting point with the `batch` [blueprint](/concepts/15-blueprints/), and see the `docs` folder in `chenile-process-management` for the PlantUML process diagrams.
