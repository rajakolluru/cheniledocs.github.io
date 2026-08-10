---
title: "Architecture"
kicker: "How it fits together"
permalink: /architecture/
summary: "Chenile is a layered framework, not a single application. Requests are normalized into an exchange and run through an interceptor pipeline — the same pipeline that carries your policies."
---

## A layered framework

Chenile is organized as layers that build on one another. Each layer is a set of repositories with a clear job.

### Layer 1 — Build and version baseline

`chenile-parent` is the Maven super-parent for the whole ecosystem. It inherits from Spring Boot and centralizes the Java version, Spring Boot version, library and plugin versions, and every Chenile artifact version. It is the first repository upgraded and published in a release; downstream repositories inherit properties such as `chenile.core.version`, `chenile.security.version` and `chenile.messaging.version`.

### Layer 2 — Core runtime

`chenile-core` is the substrate everything else builds on. Its concerns are:

- normalizing every request or event into a **`ChenileExchange`**,
- executing that exchange through an **interceptor and orchestration pipeline**,
- loading **service and operation definitions**,
- **HTTP adaptation**, **state-machine (STM)** support, and persistence/utility helpers,
- a multi-version metadata model that aggregates every classpath `*version.txt` into a version map so each service reports its own version.

This pipeline is the mechanism behind the whole policy story — interceptors *are* your policies.

### Layer 3 — Application blueprints

`chenile-query-workflow-blueprints` and `chenile-process-management` encode higher-level patterns: metadata-driven query services (MyBatis), workflow-enabled services built on Chenile STM, and long-running process orchestration with sub-process tracking.

### Layer 4 — Integration capabilities

`chenile-service-registry`, `chenile-proxies`, `chenile-security` and `chenile-messaging` provide the capabilities around service interaction: the registry that binds policies to operations, interface-based proxies for local and remote calls, the contract-first auth framework (auth-server, **gateway**, resource-server), and messaging/pub-sub integrations.

### Layer 5 — Testing, auxiliary and configuration

`chenile-bdd` supplies Cucumber-based integration testing; `chenile-others` adds file-watch, a Kubernetes-aware scheduler, cache and the config maven plugin; `cconfig` supplies modular runtime configuration the rest of the stack can consume.

## The runtime model in one picture

<p><img src="/assets/img/chenile-architecture.svg" alt="Chenile runtime: a request flows from the client through the API gateway (authentication, rate-limiting, coarse authorization) into a service, where it becomes a ChenileExchange and runs through the interception pipeline of policies before reaching the pure business logic. The same interceptor contract runs in both the gateway and the last mile."></p>

The same exchange-and-pipeline model runs inside the auth **gateway** and inside each **service**, which is what lets a single policy abstraction serve both the edge and the last mile. A request is normalized into a `ChenileExchange`, run through the interception pipeline (your service policies — security, tenancy, i18n, logging), reaches the pure business logic, and returns back out through the same pipeline.

> The PlantUML source for this diagram is included in the site under `diagrams/chenile-architecture.puml`.

## Dependency direction

Dependencies always point toward abstractions: consumers depend on `*-api` modules, never on `*-service` modules. Repositories are versioned together through `chenile-parent` and are currently aligned on **v{{ site.maven_version }}**.

<p style="margin-top:2em"><a class="btn btn-ghost" href="/repositories/">See every repository →</a></p>
