---
layout: doc
title: JGen blueprint reference
description: Every built-in JGen blueprint, its prompts and defaults — including the 2.1.31 headless-service, ecosystem and process-management blueprints.
permalink: /developer/jgen-blueprints/
---

# JGen blueprint reference

[JGen](/concepts/12-jgen/) is Chenile's Java code generator (repository `rajakolluru/chenile-gen`). A **blueprint** is a template tree plus a `META-INF/blueprint.json` that declares its prompts; the engine copies the tree, renders Mustache templates, renames placeholder paths (`__service__`, `__Service__`, …), applies conditional folders (`%%jpa=true%%`) and runs the blueprint's init hook. To write your own, see [writing blueprints](/concepts/15-blueprints/).

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
| [`chenile-process-management`](#process-management) | A typed, multi-level process application | **2.1.31** |
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

### <a id="process-management"></a>`chenile-process-management` <span class="pill">2.1.31</span>
Generates a runnable mini-monolith for any number of [process](/developer/process-management/) types, with arbitrary hierarchy depth and multiple child types. Prompts: `application`, `applicationVersion`, `destFolder`, `processSpec` (a JSON file), `definitionSource` (`json` | `database`), `registerInServiceRegistry` (n) + `serviceRegistryUrl`.

```json
{
  "processes": [
    { "processType": "Import", "inputType": "ImportIn", "fields": {"batchId": "string"},
      "children": ["Partition"], "config": {"partitionSize": "100"} },
    { "processType": "Partition", "fields": {"partitionId": "long"}, "children": ["Record", "Audit"] },
    { "processType": "Record", "fields": {"recordId": "string", "overwrite": "boolean"} },
    { "processType": "Audit",  "fields": {"recordId": "string"} }
  ],
  "cronTriggers": []
}
```

- `fields` map to typed input DTOs (`string`, `int`/`integer`, `long`, `boolean`, `double`); `children` empty means leaf; parents are derived.
- `implementation`: `custom` (default — an explicit scaffold that throws until you implement it), `fileSplit` or `fileRead` (real byte-chunking with SHA-256/byte counts).
- Optional `predecessorProcessType` / `predecessorArgs` chain processes; `cronTriggers` seed **disabled** Quartz schedules with typed `args`.
- Validation rejects cycles, dangling references, unsafe names and invalid cron/timezone/type values before any file is written.

Output: one reactor — `<app>-api`, `<app>-service`, `<app>-configurations`, `<app>-package` — running generated workers on the JDBC queue, with definitions emitted as `defs.json` (or seeded into `process_definition`, preserving later admin edits). Every process is a Chenile HTTP service behind the [administrator key](/developer/process-admin/). Examples in `bp-process-management/examples` include a FileUpload/ChunkUpload pair and a three-level BatchUpload → FileUpload → ChunkUpload.

```sh
jgen-cli/bin/jgen.sh -f bp-process-management/examples/file-upload-input.json
cd output/uploads && mvn install
export PROCESS_MANAGEMENT_API_KEY="$(openssl rand -hex 32)"
java -jar uploads-package/target/uploads-exec.jar --spring.profiles.active=dev
```

### <a id="batch"></a>`batch`
Prompts: `batch`, `batchVersion`, `destFolder`, `batchJson` (the hierarchy). Uses the unified `config` and predecessor fields as of 2.1.31; prefer `chenile-process-management` for new typed multi-level work.

## Building blocks

### <a id="interceptor"></a>`chenile-interceptor`
Prompts: `interceptorName`, `interceptorVersion`, `destFolder`. Scaffolds a [service policy](/concepts/03-service-policies/) extending `BaseChenileInterceptor`.

### <a id="it"></a>`it`
Prompts: `app`, `appVersion`, `entity`, `destFolder`, `security`. An integration-test project using `it-cucumber-utils` from `chenile-bdd` — the same Gherkin [run over REST Assured](/concepts/06-bdd-testing/).

### <a id="jgen-blueprint"></a>`jgen-blueprint`
Prompts: `blueprintName`, `destFolder`, `security`, `jpa`, `cloudSwitchEnabled`. Generates a new blueprint module — JGen generating JGen. See [writing blueprints](/concepts/15-blueprints/).

<div class="callout"><div class="t">Also</div>
<code>jgen-portal</code> is a web UI for running blueprints with per-session workspaces. Each blueprint module (<code>bp-*</code>) holds its <code>blueprint.json</code>, an optional <code>Init…Blueprint</code> hook and its template folder.</div>
