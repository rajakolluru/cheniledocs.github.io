---
layout: doc
title: JGen blueprint reference
description: Every built-in JGen blueprint, its prompts and defaults, plus the engine features — composable and aggregated blueprints, conditional templates and declarative input validation — added in 2.1.32.
permalink: /developer/jgen-blueprints/
---

# JGen blueprint reference

Current source and generator defaults target **Chenile {{ site.maven_version }}**. The
2.1.33 build is verified; artifact publication is pending. See the
[release notes](/release-notes/2.1.33/). Version labels below identify when a feature
was introduced or its minimum runtime, rather than claiming publication.

[JGen](/concepts/12-jgen/) is Chenile's Java code generator (repository `rajakolluru/chenile-gen`). A **blueprint** is a template tree plus a `META-INF/blueprint.json` that declares its prompts; the engine copies the tree, renders Mustache templates, renames placeholder paths (`__service__`, `__Service__`, `__application__`, …), applies conditional folders (`%%jpa=true%%`), invokes other blueprints through aggregation markers (`{% raw %}%{{minimonolith role=server}}{% endraw %}`), and runs the blueprint's init hook. Every blueprint also accepts an optional parent POM and extra dependencies. See [engine features](#engine-features) below and [writing blueprints](/concepts/15-blueprints/).

```sh
git clone https://github.com/rajakolluru/chenile-gen.git && cd chenile-gen
make clean all && source setpath.sh
jgen                                   # interactive: pick a config, then a blueprint
jgen -g <blueprint> -o input.json      # write a sample input contract
jgen -f input.json                     # generate non-interactively
```

Defaults such as package (`com.mycompany.myorg`), version and output folder come from the JGen config; `jgen -e` emits it to `./config` for editing.

## Blueprint catalogue

| Blueprint | Generates | Since |
|---|---|---|
| [`chenile-service`](#chenile-service) | An HTTP Chenile service (`-api` + `-service`) | — |
| [`chenile-headless-service`](#headless) | A non-HTTP Chenile service | **2.1.31** |
| [`chenile-ecosystem`](#ecosystem) | A complete ecosystem composed from the other blueprints | **2.1.31** |
| [`wfservice`](#wfservice) | A workflow (state-machine) service | — |
| [`wfcustom`](#wfcustom) | A workflow service from your own states XML | — |
| [`mybatisQuery`](#mybatisquery) | A metadata-driven MyBatis query module | — |
| [`minimonolith`](#minimonolith) | A deployable Spring Boot mini-monolith | — |
| [`chenile-process-workers`](#process-workers) | One worker JAR for one process definition | **2.1.32** |
| [`chenile-process-management`](#process-management) | A process **server + worker deployment** (server, worker-listener, per-definition worker JARs, optional registry) | **2.1.32** |
| [`batch`](#batch) | A batch process from a hierarchy JSON | — |
| [`chenile-interceptor`](#interceptor) | A Chenile interceptor (service policy) | — |
| [`it`](#it) | An integration-test project | — |
| [`jgen-blueprint`](#jgen-blueprint) | A new JGen blueprint module | — |

**Version gating.** A blueprint may declare `sinceVersion`; JGen validates it against your configured `chenileVersion` through its OWIZ processor chain **before** any hook runs or file is written — so you can't generate code your runtime doesn't support.

## Services

### <a id="chenile-service"></a>`chenile-service`
Prompts: `service`, `serviceVersion`, `destFolder`, `security` (n), `jpa` (y), `cloudSwitchEnabled` (n), `enableMCP` (n). Produces `<svc>-api` (model + interface) and `<svc>-service` (controller, implementation, configuration, health checker, error codes, BDD tests, `scripts/curl-scripts.sh`). Endpoints: `POST /<svc>`, `GET /<svc>/{id}`, `POST /<svc>/op1`.

### <a id="headless"></a>`chenile-headless-service` <span class="pill">2.1.31</span>
Prompts: `service`, `serviceVersion`, `destFolder`, `registerInServiceRegistry` (y). Generates a [transport-neutral](/concepts/annotation-based-services/) service — a plain Spring bean with `@ChenileController`, `@ChenileOperation` and `@ChenileBody`, no HTTP routes — reachable in-process, from events or from serverless hosts.

### <a id="wfservice"></a>`wfservice`
Prompts: `service`, `serviceVersion`, `destFolder`, `activity` (mandatory/optional activities), `enablement` (config-based enable/disable of states and transitions), `jpa`, `cloudSwitchEnabled`, `security`, `enableMCP`. Generates an `OPENED → ASSIGNED → RESOLVED → CLOSED` workflow, its STM XML, actions, entity store, `POST /<svc>`, `GET /<svc>/{id}`, `PATCH /<svc>/{id}/{eventID}` and the `/<svc>/info/*` introspection endpoints (state diagram, allowed actions, JSON, test cases).

### <a id="wfcustom"></a>`wfcustom`
As `wfservice`, but driven by your own states XML file (`xmlFile`).

### <a id="mybatisquery"></a>`mybatisQuery`
Prompts: `namespace`, `namespaceVersion`, `destFolder`, `security`. Generates a MyBatis mapper (`<ns>.xml`, including the `-count` query for pagination) and query metadata (`<ns>.json`), served at `POST /q/<name>` by the query controller. See [Chenile Query](/concepts/11-chenile-query/).

## Deployables

### <a id="minimonolith"></a>`minimonolith`
Prompts: `monolith`, `monolithVersion`, `destFolder`, `jpa`, `cloudSwitchEnabled`, `security`, `enableMCP` (+ `mcpServerName`, `mcpInstructions`), `enableServiceRegistry` (host the registry), `enableServiceRegistryDelegate` (+ `serviceRegistryUrl`), `dependencies` (the services to host), `enableQueryController`, `enableH2Console`. A Spring Boot deployable hosting one or more services; MCP is served at `/mcp` when enabled.

### <a id="ecosystem"></a>`chenile-ecosystem` <span class="pill">2.1.31</span>
Composes the blueprints above into a working system in one folder:

| Prompt | Default | Adds |
|---|---|---|
| `ecosystem`, `ecosystemVersion`, `destFolder` | — | names the enclosing folder and versions |
| `service`, `monolith` | `${ecosystem}Service`, `${ecosystem}Monolith` | the HTTP service and its primary mini-monolith |
| `security`, `jpa` | n, y | applied to generated mini-monoliths |
| `includeServiceRegistry` (+ `serviceRegistryMonolith`, `serviceRegistryUrl`) | n | a separate registry host; the primary monolith becomes its delegate |
| `includeCconfig` | n | [cconfig](/concepts/08-configuration-management/) in the primary monolith |
| `includeHeadlessService` (+ `headlessService`, `headlessMonolith`) | n | a headless service with its own monolith |
| `includeQueryService` (+ `queryNamespace`, `queryMonolith`) | n | a MyBatis query service with a query-controller monolith |

Each composed project is generated in isolation before being placed together, so filename processing can't interfere. An **enclosing Maven reactor parent POM** builds every selected project; their root POMs inherit from it.

## Process management and batch

### <a id="process-workers"></a>`chenile-process-workers` <span class="pill">2.1.32</span>
Generates **one plain worker JAR for one [process](/developer/process-management/) definition**: a **leaf** type gets an **executor**; a **non-leaf** type gets a **splitter + aggregator** in the same JAR. Prompts: `workerModule`, `application`, `packageName`, `processType`, `name`, `inputType`, `leaf` (y), `children` (array of `name`/`inputType`), version, and the usual `destFolder` / `super_pom` / `dependencies`. The generated `doStart` hooks throw until you implement them — they are application code — and the payload model comes from the application's API JAR. It is reused per definition by `chenile-process-management`.

### <a id="process-management"></a>`chenile-process-management` <span class="pill">2.1.32</span>
Generates the whole **[server + worker deployment](/developer/process-management/)** — not a single app — by **composing** `minimonolith` and `chenile-process-workers`. From native `processMap` definitions it emits a process **server**, a headless **worker**, **per-definition worker JARs** and an **optional service registry**, decoupled over **Kafka**.

Prompts: `application`, `applicationVersion`, `destFolder`, `processSpec` (native `processMap` file), `cronSpec` (optional, **separate** cron schedules), `definitionSource` (`json` | `database`), `registryMode` (`create` | `existing` + `existingRegistryUrl`), `registryPlacement` (`server` recommended | `separate`), `serverDeploymentUrl` / `workerDeploymentUrl` / `registryDeploymentUrl` (`:8000/:8001/:8002`), `transport` (`kafka`), `workTopic` (`<application>-work`, fills any definition lacking `config.queue`), plus `super_pom` / `dependencies`.

The process spec keeps the runtime's **native shape** (not the old `processes[]` array):

```json
{
  "processMap": {
    "Import":    { "leaf": false, "config": {"partitionSize": "100"} },
    "Partition": { "parentProcessType": "Import", "leaf": false },
    "Record":    { "parentProcessType": "Partition", "leaf": true }
  },
  "inputFields": { "Import": {"batchId": "string"}, "Record": {"recordId": "string"} }
}
```

Cron schedules are a **separate** JSON array (`cronSpec`), read by `JsonCrontabRepository`, seeded **disabled**, packaged only by the server. `inputFields` map to typed DTOs; a definition with no children is a leaf; `predecessorProcessType`/`predecessorArgs` chain processes. Names, hierarchy, deployment URLs and the Kafka topic are validated before any file is written.

**Generated modules:**

- `<app>-api` — shared typed payloads and process-start contracts.
- `<app>-server-config` — native definitions + cron seeds (server only).
- `<app>-server-service` — typed Chenile HTTP services, process bootstrap, runtime services and acknowledged Kafka publication (trigger `202`/`Location`). Ships **no** business workers.
- `<app>-<processType>-workers` — one JAR per definition (via `chenile-process-workers`).
- `<app>-worker-listener` — a headless Chenile Kafka listener: subscribes to every topic, validates/restores tenant, invokes workers, calls back through the registry-backed process delegate, handles retry. No process datasource, process service or JDBC starter.
- `<app>Server`, `<app>Worker` — composed `minimonolith` hosts (the server uses one queue-based Kafka starter; the worker has no process DB); `<app>Registry` only when the registry is placed separately.

```sh
jgen-cli/bin/jgen.sh -f bp-process-management/examples/file-upload-input.json
cd output/uploads && mvn install
```

Generated server/worker tests run over Kafka with `KafkaBaseTest` (Testcontainers) — **Docker must be running** for `mvn install`. Examples in `bp-process-management/examples` include a FileUpload pair and a three-level hierarchy. The stock [`process-admin-server`](/developer/process-admin/) is in-VM and ships no workers; use this blueprint for a real deployment.

### <a id="batch"></a>`batch`
Prompts: `batch`, `batchVersion`, `destFolder`, `batchJson` (the hierarchy). Uses the unified `config` and predecessor fields as of 2.1.31; prefer `chenile-process-management` for new typed multi-level work.

## Building blocks

### <a id="interceptor"></a>`chenile-interceptor`
Prompts: `interceptorName`, `interceptorVersion`, `destFolder`. Scaffolds a [service policy](/concepts/03-service-policies/) extending `BaseChenileInterceptor`.

### <a id="it"></a>`it`
Prompts: `app`, `appVersion`, `entity`, `destFolder`, `security`. An integration-test project using `it-cucumber-utils` from `chenile-bdd` — the same Gherkin [run over REST Assured](/concepts/06-bdd-testing/).

### <a id="jgen-blueprint"></a>`jgen-blueprint`
Prompts: `blueprintName`, `destFolder`, `security`, `jpa`, `cloudSwitchEnabled`. Generates a new blueprint module — JGen generating JGen. See [writing blueprints](/concepts/15-blueprints/).

## <a id="engine-features"></a>Engine features <span class="pill">2.1.32</span>

Blueprints are not just template trees — the JGen engine gives every blueprint composition, conditional generation and validation for free.

### Composable blueprints — a shared parent and extra dependencies
Every built-in blueprint accepts an optional `super_pom` (a `SuperPOM` with `groupId`, `artifactId`, `version` and `relativePath`, defaulting to `../pom.xml`) and an optional `dependencies` array (`POM_Dependencies`). The parent changes only in the **outermost** generated POM; child modules keep their generated parent. Omit them to keep defaults. Coordinate values support JGen `${…}` substitutions.

```json
{
  "blueprint": "chenile-service", "service": "orders", "serviceVersion": "1.0.0",
  "super_pom": { "groupId": "com.example", "artifactId": "application-parent", "version": "1.0.0" },
  "dependencies": [ { "groupId": "com.example", "artifactId": "shared-contracts", "version": "1.0.0" } ]
}
```

### Aggregated blueprints — one blueprint invokes others
An **aggregated** blueprint includes other registered blueprints through **empty marker folders** in its template tree (an empty `.gitkeep` is allowed; other contents are rejected):

{% raw %}
```text
%{{minimonolith role=server}}/
%{{minimonolith role=worker label="Background workers"}}/
%{{chenile-process-workers forEach=processes as=process}}/   # once per list element
```
{% endraw %}

The first token is the exact registered blueprint name; the remaining `key=value` attributes (quote values with spaces or `=`) are handed to the enclosing blueprint's **`childBlueprintInputs`** callback (registered by its init hook), which computes the child's input map from the aggregate's current inputs. The child then runs its own defaults, validation, hooks and generation under the same JGen config. Repeated and nested invocations are supported. `chenile-ecosystem` and `chenile-process-management` are the built-in aggregates.

### Conditional templates and placeholders
- **Conditional folders** `%%key=value%%` include a subtree only when an input matches — e.g. `%%jpa=true%%`, `%%separateRegistry=true%%`. Everything inside is emitted (unwrapped) when the condition holds and skipped otherwise.
- **Path placeholders** in folder and file names are substituted: `__service__`, `__Service__`, `__application__`, `__workerModule__`, and the package segments `__com__` / `__company__` / `__org__`.
- **Mustache** renders file bodies against the (possibly hook-augmented) input map.

### Declarative input validation
Input fields declare a `type` (`STRING`, `BOOLEAN`, `FILE`, `DROPDOWN` + `validValues`, `RECORD_ARRAY` + `childFields`, `SuperPOM`, `POM_Dependencies`) and an optional `validation` rule — `JAVA_IDENTIFIER`, `JAVA_TYPE`, `JAVA_PACKAGE`, `PROJECT_NAME`, `VERSION`, `HTTP_URL`, `KAFKA_TOPIC`. A `visibleWhen` map (e.g. `{"registryMode": "create"}`) gates a prompt's visibility in the CLI and portal **and** its server-side validation. JGen applies all of this uniformly across interactive, file and composed/child inputs **before** any hook runs. **Version gating** is part of the same pass: a blueprint's `sinceVersion` is checked against your configured `chenileVersion` before anything is generated.

Built-in blueprint fields that become Java package segments use `JAVA_IDENTIFIER`,
including service, batch, interceptor, query, monolith and generated-blueprint names.
Ecosystem child names follow the same rule. Workflow names retain their existing
transformations and `PROJECT_NAME` rule. Nested record fields are validated too;
unknown rule names are configuration errors.

<div class="callout"><div class="t">Also</div>
<code>jgen-portal</code> is a web UI for running blueprints with per-session workspaces. Each blueprint module (<code>bp-*</code>) holds its <code>blueprint.json</code>, an optional <code>Init…Blueprint</code> hook and its template folder.</div>
