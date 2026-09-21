---
layout: doc
title: Admin UI
description: A drop-in React console for inspecting a running Chenile system — services, definitions, health, workflow diagrams and the service registry.
permalink: /developer/admin-ui/
---

# Admin UI

`chenile-admin-ui` is a Maven-packaged React frontend for **inspecting a running Chenile system**. Add the dependency and it serves itself from the same JVM at **`/chenile/admin`** — no separate deployment:

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>chenile-admin-ui</artifactId>
</dependency>
```

## What it shows

The UI is intentionally thin: it reads Chenile's own info endpoints and renders them. Point it at a base URL (e.g. `localhost:8000`) and it will:

- list deployed services via **`GET /info`**;
- show a service's full `ChenileServiceDefinition` via **`GET /service-info/{service}`**;
- run a service's health probe via **`GET /health-check/{service}`** (when it has a health checker);
- for a workflow service that exposes its generated `*StateEntityInfoService`, render the **workflow PNG diagrams and test-case diagrams** from the `/{service}/info/...` endpoints (see [Finito's introspection](https://thefinito.org/#advanced));
- when the monolith hosts `serviceregistryService`, call **`GET /serviceregistry`** to show the ecosystem-wide [service catalog](/concepts/09-registry-and-proxies/) aggregated from all delegates;
- probe common **Swagger/OpenAPI** endpoints and link to the docs when present.

## Notes

Because everything it reads is a standard Chenile info endpoint, the Admin UI works against any Chenile monolith without per-app configuration. In local Vite development it uses an internal proxy endpoint to avoid browser CORS failures when the Chenile server is on another origin (e.g. `http://localhost:8000`).

<div class="callout"><div class="t">Where to look</div>
Module: <code>chenile-core/chenile-admin-ui</code> (a Vite/React app packaged as a Maven artifact, served at <code>/chenile/admin</code>). It pairs naturally with the workflow <a href="/developer/entry-points/">introspection</a> endpoints and the <a href="/concepts/09-registry-and-proxies/">service registry</a>.</div>
