---
title: Chenile Admin UI Guide
keywords: chenile admin ui service registry health check info service-info
tags: [chenile admin ui operations service registry]
sidebar: codex_sidebar
permalink: /codex-chenile-admin-ui-guide.html
folder: codex-docs
summary: Guide to the standalone React-based Chenile Admin UI, including local inspection mode and ecosystem mode through the central service registry.
---

## Purpose

`chenile-admin-ui` is a standalone React frontend that lives inside the `chenile-core` repository.

It is meant for operational inspection of a running Chenile system without writing custom scripts or manually calling framework endpoints.

From `2.1.24`, it is also published as a Maven module:

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>chenile-admin-ui</artifactId>
</dependency>
```

When included in a Spring MVC Chenile application, it is packaged into the application jar and served at:

- `/chenile/admin`

## What it reads

At minimum, the UI uses:

- `GET /info`
- `GET /service-info/{service}`
- `GET /health-check/{service}`

It also probes common Swagger/OpenAPI URLs on the same server and shows a direct link when documentation is available.

When the target hosts the central registry, the UI also uses:

- `GET /serviceregistry`
- `GET /serviceregistry/diagnostics`

## Local deployment mode

When you point the UI at a single Chenile monolith, it can:

- list all locally deployed services from `/info`
- show service metadata such as id, bean name, version, module name, base URL, and operations
- run a health check for services whose `healthCheckerName` is populated

This is the default mode and works even when no service registry is involved.

## Ecosystem mode through service registry

If the target monolith hosts `serviceregistryService`, the UI enables a second view backed by the central service registry.

That view reads:

- `GET /serviceregistry`

This allows the UI to show the full Chenile service ecosystem in one place, not just the services deployed in the current monolith.

Why this works:

- the central registry monolith runs `service-registry-service`
- delegate monoliths use `service-registry-delegate`
- delegates publish the services and operations they expose to the central registry
- the registry therefore becomes the system-wide catalog

Operationally, the central registry host is the monolith where:

- `chenile.remote.service.registry` is empty
- `serviceregistryService` is deployed locally

Delegate monoliths point `chenile.remote.service.registry` at that host.

From `2.1.24`, ecosystem mode also highlights registry hygiene issues such as:

- duplicate service-version groups
- changed definitions published under the same version
- invalid service rows
- duplicate operation or parameter links

## Health checks in ecosystem mode

Registry entries can also expose `healthCheckerName`.

When that field is present, the UI can execute the remote monolith’s health-check endpoint using the `baseUrl` registered for that service.

That means the UI can move from discovery into a light operational check without needing extra per-service wiring.

## Packaged deployment

`chenile-admin-ui` is meant to be embedded into an existing Chenile server rather than deployed as a separate Node service in production.

Operationally, that gives you:

- the same origin as the backend APIs
- no separate frontend deployment pipeline for simple operations use cases
- a stable URL for operators: `/chenile/admin`

The module packages static assets under Spring's `META-INF/resources` path, so standard Spring MVC resource handling can serve the UI.

## Development notes

The frontend uses a Vite proxy in local development so that a browser-based UI running on one origin can still talk to a Chenile server on another origin such as `http://localhost:8000`.

In production, one of these needs to be true:

- the backend allows CORS
- the UI is served from the same origin
- another proxy layer is placed in front

The preferred production shape is the second one: serve the UI from the same origin by embedding `chenile-admin-ui` into the target application.

## When to use it

Use `chenile-admin-ui` when you need to:

- inspect service metadata quickly
- confirm service versions and operations
- verify which monolith is hosting which services
- browse the central service registry catalog
- detect duplicate or invalid service-registry rows before enforcing DB constraints
- run health checks on services that expose a checker

It is especially useful in multi-monolith Chenile deployments where service-registry-service and service-registry-delegate are already in use.
