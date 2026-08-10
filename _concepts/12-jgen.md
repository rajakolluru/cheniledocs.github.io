---
title: "jgen: blueprint code generation, in depth"
short: "jgen code generation"
order: 12
summary: "jgen (in chenile-gen) scaffolds whole Chenile projects from blueprints — service, workflow, MyBatis query, interceptor, monolith and more. Choose a blueprint, answer a few questions, and get a project that compiles against the standard runtime."
---

## Stop hand-building modules

Every Chenile service has the same shape — an `api` module, a `service` module, POMs that inherit from `chenile-parent`, test harnesses, config. Typing that by hand is error-prone and slow. **jgen** — the code generator in the neighbouring `chenile-gen` repository — generates it from a **blueprint**.

The flow is always the same four moves:

1. **choose a blueprint**,
2. **provide input values** (service name, package, options),
3. jgen **copies a template tree** and fills in names, packages and conditional modules,
4. the generated project **compiles against the standard Chenile runtime libraries**.

## The built-in blueprints

Pick a blueprint below to see what it generates and what it depends on:

<div class="jsx" data-jsx="blueprint"></div>

The most-used ones for building applications are:

- **`chenile-service`** — a plain Chenile service (`api` + `service`).
- **`wfservice`** — a standard workflow service (fixed status model), depending on `workflow-api` / `workflow-service` and using `stm-generate-puml` for diagrams.
- **`wfcustom`** — a *custom* workflow generated from your own STM XML (the [Finito](https://thefinito.org) blueprint).
- **`mybatisQuery`** — a metadata-driven [query service](/concepts/11-chenile-query/) that depends on `chenile-query-controller`.
- **`minimonolith`** — a deployable that hosts one or more services.

Plus `chenile-interceptor` (a reusable policy), `it` (an integration-test harness), `batch` (bulk processing), and the wonderfully recursive **`jgen-blueprint`** — a blueprint that generates new blueprints.

## Inside a blueprint

A blueprint is a small, self-describing plugin. Its `blueprint.json` declares an init hook, a template folder, and the input fields jgen will prompt for:

```json
{
  "initHook": "org.chenile.jgen.blueprint.wfcustom.InitWfcustomBlueprint",
  "name": "wfcustom",
  "description": "Generates a New Custom Workflow",
  "templateFolder": "wfcustom-template",
  "inputFields": [
    { "name": "service", "type": "STRING", "description": "Workflow Entity" },
    { "name": "jpa", "type": "BOOLEAN", "defaultValue": "y" },
    { "name": "security", "type": "BOOLEAN", "defaultValue": "n" },
    { "name": "xmlFile", "type": "FILE", "description": "STM XML file" }
  ]
}
```

The **template folder** is a real directory tree with Mustache placeholders in both file *names* and *contents*: folders like `__service__/__service__-api`, files like `pom.xml.mustache`, and package paths such as `__com__/__company__/__org__/__servicePackage__`. Conditional sections (`{{#security}}…{{/security}}`, `{{#activity}}…{{/activity}}`) switch whole modules and code paths on and off based on the answers you gave. jgen expands the tree, substitutes every placeholder, and — where a blueprint requests it — initializes a git repo and wires the build.

## Samples come built in

jgen ships sample inputs and templates with each blueprint, so you can generate a working project on the first run and read the output to learn the conventions. A generated `wfcustom` project, for instance, contains the STM XML, the generated actions and hooks discovered [by convention](/concepts/09-registry-and-proxies/), a health checker, BDD tests, and the PlantUML/Mermaid diagram wiring — a complete, buildable service you can run immediately.

<div class="callout key"><div class="t">Why this matters</div>
Blueprints encode Chenile's conventions as executable templates. New services start correct — consistent structure, the right dependencies, tests and diagrams in place — so teams spend their time on business logic, not scaffolding.</div>
