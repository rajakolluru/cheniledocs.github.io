---
title: Chenile Architecture and Release Guide
keywords: chenile architecture release guide runtime dependency
tags: [chenile architecture release maintainer]
sidebar: codex_sidebar
permalink: /codex-chenile-architecture-release.html
folder: codex-docs
summary: Architecture layers, runtime model, dependency direction, and the release and deploy workflow for the primary Chenile repositories.
---

Chenile is organized as a layered framework rather than a single application:

- `chenile-parent` defines the common build and dependency baseline.
- `chenile-core` provides the execution engine, exchange model, interceptors, HTTP binding, state machine support, and core helpers.
- `chenile-query-workflow-blueprints` builds reusable query and workflow service patterns on top of the core runtime.
- `chenile-service-registry`, `chenile-proxies`, `chenile-security`, and `chenile-messaging` provide integration capabilities around service interaction.
- `chenile-process-management` adds long-running orchestration over parent and child processes.
- `chenile-bdd`, `chenile-others`, and `cconfig` provide supporting capabilities.

## Architecture Layers

### Layer 1: Build and version baseline

Repository:
- `chenile-parent`

This is the Maven super-parent for the ecosystem. It inherits from Spring Boot and centralizes Java version, Spring Boot version, library versions, plugin versions, and Chenile artifact versions for all sibling repositories.

### Layer 2: Core runtime

Repository:
- `chenile-core`

This is the runtime substrate that the rest of the framework builds on. Its main concerns are:

- request and event normalization into `ChenileExchange`
- execution through an interceptor and orchestration pipeline
- service definition and operation definition loading
- HTTP adaptation
- state machine support
- persistence and utility helpers

### Layer 3: Application blueprints

Repositories:
- `chenile-query-workflow-blueprints`
- `chenile-process-management`

These repositories encode higher-level service patterns:

- query services backed by metadata and MyBatis
- workflow-enabled services built on Chenile STM
- long-running process orchestration with sub-process tracking

### Layer 4: Integration capabilities

Repositories:
- `chenile-service-registry`
- `chenile-proxies`
- `chenile-security`
- `chenile-messaging`

These repositories make the core runtime usable in distributed, secured, and event-driven deployments.

### Layer 5: Testing and operational support

Repositories:
- `chenile-bdd`
- `chenile-others`
- `cconfig`

## Runtime Model

The runtime center of gravity is in `chenile-core`.

### Common request model

Chenile normalizes incoming work into a `ChenileExchange`. That exchange carries:

- request metadata
- selected service and operation
- request body and files
- resolved target bean and method
- response and exception state

### Request-scoped context

`chenile-core` also uses `ContextContainer` as a request-scoped metadata holder for framework headers and request metadata.

Key constraint:

- `ContextContainer` is backed by `ThreadLocal`
- it is populated during interceptor execution
- it is cleared when the request finishes

So it is safe for normal synchronous request handling, but it is not a general cross-thread context propagation mechanism. If work moves to another thread, the new thread will not automatically see the original request context.

### Interceptor highway

The typical execution path is:

1. build a `ChenileExchange`
2. run fixed and interpolated interceptors
3. resolve the target service bean and method
4. transform the payload into target Java types
5. invoke the service method
6. build the response

Several runtime features depend on `ContextContainer`, including tenant-aware datasource routing and request-aware utility code. That makes its thread-local behavior an architectural consideration when using executors, async code, or reactive flows.

## Dependency Direction Across Repositories

At a high level:

1. Everything inherits from `chenile-parent`.
2. `chenile-core` provides the most reused runtime foundation.
3. `chenile-query-workflow-blueprints` depends heavily on the core libraries.
4. `chenile-service-registry`, `chenile-proxies`, `chenile-security`, `chenile-messaging`, `chenile-process-management`, `chenile-others`, and `cconfig` sit above the shared parent and consume selected Chenile runtime libraries where needed.
5. `chenile-bdd` provides testing support rather than serving as a runtime foundation.

## Build and Release Workflow

All 11 repositories follow a similar Makefile pattern:

- `build`: `mvn -Drevision=$(version) install`
- `deploy`: `mvn -B -DskipTests -Drevision=$(version) -DperformRelease=true deploy`
- `tag`: creates an annotated git tag
- `find-latest-local-tag`: uses `git describe | cut -d- -f1`

The version comes from a repo-local text file such as `chenile-version.txt` or `chenile-core-version.txt`.

### Release order

For versioned multi-repo releases, the correct sequence is:

1. update `chenile-parent`
2. update the other 10 repositories to point to the new `chenile-parent`
3. run local build verification
4. commit and tag each repository
5. deploy `chenile-parent`
6. confirm `org.chenile:chenile-parent:<version>` is visible in Maven Central
7. only then deploy the remaining 10 repositories

### Why annotated tags matter

`git describe` prefers annotated tags by default. If a lightweight tag is created, `git describe` may still resolve to the previous annotated tag, which makes the release metadata misleading.
