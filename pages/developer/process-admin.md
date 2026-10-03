---
layout: doc
title: Process administration — API, dashboard & server
description: Manage crons, manual triggers, process definitions and execution traces through the process-management API, the React dashboard, and the runnable administrator server.
permalink: /developer/process-admin/
---

# Process administration — API, dashboard &amp; server

> **Release status:** new in 2.1.31 — `chenile-parent:2.1.31` is on Maven Central; the `chenile-process-management` artifacts follow in the [release train](/developer/release-process/).

Three pieces make [process management](/developer/process-management/) operable without writing SQL:

- a **management API** — an opt-in Spring MVC administration API inside any process host;
- **`process-ui`** — a React dashboard for schedules, triggers, definitions, process trees and end-to-end traces;
- **`process-admin-server`** — a runnable Spring Boot host that bundles the API with database definitions, Quartz, the [outbox](/developer/process-outbox/) and JDBC worker delivery.

It is an **administrator console**, not an end-user application.

## Run it locally

```sh
export PROCESS_MANAGEMENT_API_KEY="$(openssl rand -hex 32)"
mvn install -q -pl process-admin-server -am -DskipTests
java -jar process-admin-server/target/process-admin-server-exec.jar --spring.profiles.active=dev
```

The API listens on `http://127.0.0.1:8080` (override with `PROCESS_ADMIN_PORT`, `PROCESS_ADMIN_BIND_ADDRESS`). The `dev` profile uses a file-backed H2 database under `./.process-admin/data` and initializes tables — local development only. Then start the UI (Node 22.12+):

```sh
cd process-ui
npm ci
PROCESS_API_TARGET=http://127.0.0.1:8080 npm run dev
```

Open the Vite URL, enter a tenant (e.g. `default`) and the key. The dev proxy forwards only `/process-management/api`. For production, `npm run build` and serve `dist` behind a same-origin reverse proxy that forwards `/process-management/api/*`.

> **What runs the work?** The server enqueues splitter/executor/aggregator jobs into `chenile_process_work_item` but ships **no business workers**. Run your application's JDBC workers (registered `BatchService` implementations) against the same database; a leaf can show `EXECUTING` while its job waits `PENDING` until they do.

## Enable the API in your own host

```properties
chenile.process.management.enabled=true
chenile.process.management.api-key=${PROCESS_MANAGEMENT_API_KEY}
chenile.process.configurator=database
```

Hosts that import configuration explicitly must import `ProcessManagementConfiguration` and `ProcessManagementController` and scan `…process.configuration.model` and `…configuration.dao`. Apply `chenile-process-management-history-schema.sql` before deploying — history capture runs even when the API is disabled.

## Security model

- Every management call needs **`X-Process-Management-Key`** (≥ 32 characters; startup fails without a suitable key — no default is shipped) and **`x-chenile-tenant-id`**.
- The key grants administration across **all tenants**; the tenant header selects the view, it is not an identity claim. Requests cannot read or change another tenant's execution records through that view. Definitions are global by design.
- The standalone server protects **every** HTTP route, including `/process`. Library hosts protect only management routes unless `chenile.process.management.protect-all-http-routes=true`.
- The UI keeps the key **in memory only**. Never put it in Git, URLs, logs or Vite env files. No permissive CORS is enabled; serve over HTTPS behind an administrator gateway. There are no per-user roles or automatic rotation in this first version.

## API reference

All paths are relative to `/process-management/api`. Responses are plain JSON DTOs (not the Chenile `GenericResponse` envelope); errors carry a `message`. Pagination is zero-based, default 25, max 100, newest first; filters are exact matches combined with AND.

| Method / path | Purpose |
|---|---|
| `GET /info` | Definition source and write capability, cron availability, supported creation events |
| `GET /crontabs` · `POST /crontabs` · `PUT /crontabs/{id}` | List, add, edit/enable/disable `ProcessCreate` schedules |
| `POST /triggers` | Generate `ProcessCreate` through the normal trigger ingress |
| `GET /executions` | Trigger history — filters `triggerId`, `crontabId`, `status` |
| `GET /definitions` · `POST /definitions` · `PUT /definitions/{name}` | Inspect or edit definitions (writes need the database configurator; JSON returns 409) |
| `POST /definitions/refresh` | Clear this instance's definition cache |
| `GET /processes` | Filters `processType`, `status`, `triggerId`, `parentId`, `predecessorId` |
| `GET /processes/{id}` | Input/output, errors, status and completion events |
| `GET /trace?processId=…` or `?triggerId=…` | Connected execution graph (edges `PROCESS_CREATE`, `SUBPROCESS`, `EMITS`, `SUCCESSOR`) |

```json
// POST /crontabs — Quartz syntax, with seconds
{ "name": "five-minute-import", "cronExpression": "0 0/5 * * * ?", "timezone": "UTC", "enabled": true,
  "payload": { "processDefName": "Import", "args": { "source": "feed-A" } } }

// POST /triggers — optional retry key (≤ 80 chars, namespaced by tenant)
{ "triggerId": "a-client-retry-key", "payload": { "processDefName": "Import", "args": { "source": "feed-A" } } }

// POST /definitions
{ "processType": "Index", "leaf": true, "predecessorProcessType": "Import", "predecessorArgs": "OUTPUT",
  "config": { "batchSize": "100" } }
```

The API rejects predecessor cycles. Saving a definition invalidates **this** instance's cache — call `/definitions/refresh` on other instances. Cron writes return 503 if Quartz isn't configured; the current cron implementation expects **one scheduler owner**. Traces refuse executions above 1,000 processes/events (HTTP 413) — page through `/processes` instead.

## What the dashboard shows

Cron creation and editing, manual `ProcessCreate`, execution history for every trigger source, definition inspection/editing, a paginated process dashboard with child and successor drill-downs, and a clickable causal graph plus timeline from the first trigger through completion-driven successors. Execution views refresh every ten seconds.

## History semantics

`TriggerLog` stays an idempotency store only. `chenile_trigger_execution` records accepted dispatches — source, scheduled/received/start/finish times, event, payload, failure details and cron ID; duplicates add no history. `COMPLETED` means dispatch returned, not that its processes finished. `chenile_process_completion_event` records each `ProcessCompleted` payload with its generation time, transactionally with the process under the outbox. Graph edges use stored IDs, not timestamp guesses; legacy relationships show as `LEGACY_SUCCESSOR`. Choose your own retention policy for argument data and errors.

## Production (PostgreSQL)

Without `dev`, the server needs `PROCESS_DATABASE_URL`, `PROCESS_DATABASE_USERNAME` and `PROCESS_DATABASE_PASSWORD`, validates (never creates) the JPA schema, and checks that delivery tables exist. Provision the process/trigger schema plus `chenile-process-outbox-schema.sql`, `chenile-process-work-schema.sql` and `chenile-process-management-history-schema.sql` with your migration tooling. It binds to loopback by default — expose it only through a secured HTTPS gateway.
