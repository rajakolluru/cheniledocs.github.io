---
title: Chenile Modules Overview
keywords: chenile modules repositories overview
tags: [chenile architecture modules repositories]
sidebar: codex_sidebar
permalink: /codex-chenile-modules-overview.html
folder: codex-docs
summary: A cross-repository map of the 11 primary Chenile repositories, what each repository owns, and how they fit together.
---

This document summarizes the 11 primary Chenile repositories that currently move together under `chenile-parent`. It is intended as a cross-repository map: what each repository owns, which modules it contains, and how the repositories fit together in a typical Chenile installation.

## Repository Relationships

At the center is `chenile-parent`. It is the shared Maven super-parent and dependency-management BOM for the rest of the Chenile repositories. The other repositories group related runtime libraries, integration helpers, and supporting infrastructure:

- `chenile-core` supplies the basic runtime abstractions and common infrastructure.
- `chenile-query-workflow-blueprints` builds query and workflow capabilities on top of core.
- `chenile-service-registry`, `chenile-proxies`, `chenile-security`, `chenile-messaging`, `chenile-bdd`, and `chenile-others` add integration and entry-point capabilities around the core runtime.
- `chenile-process-management` adds orchestration for long-running parent and child processes.
- `cconfig` provides modular runtime configuration storage and overrides.

## Repositories

### `chenile-parent`

Role:
- Shared super-parent POM for the Chenile ecosystem.
- Standardizes Java, Spring Boot, plugin, and library versions.
- Publishes dependency-management entries for the other Chenile repositories.

Why it matters:
- This is the first repository that must be upgraded and published in a release.
- Downstream repositories inherit version properties such as `chenile.core.version`, `chenile.security.version`, `chenile.messaging.version`, and `chenile.process.management`.

Primary artifact:
- `org.chenile:chenile-parent`

### `chenile-core`

Role:
- Foundational runtime modules used by most other Chenile repositories.
- Contains the shared abstractions for service execution, HTTP exposure, state transitions, persistence support, and MCP support.

Modules:
- `stm`
- `chenile-base`
- `owiz`
- `chenile-core`
- `chenile-http`
- `cucumber-utils`
- `utils`
- `jpa-utils`
- `multi-datasource-utils`
- `chenile-mcp`

### `chenile-query-workflow-blueprints`

Role:
- Query and workflow libraries that sit above the core runtime.
- Encodes the standard Chenile patterns for query execution, workflow state transitions, and related tooling.

Modules:
- `query-api`
- `chenile-query-service`
- `chenile-query-controller`
- `workflow-api`
- `workflow-service`
- `cucumber-workflow-utils`
- `workflow-utils`
- `stm-generate-puml`

### `chenile-service-registry`

Role:
- Registry of services and delegates that helps Chenile discover or resolve service interactions.

Modules:
- `service-registry-api`
- `service-registry-service`
- `service-registry-delegate`

### `chenile-proxies`

Role:
- Proxy framework for invoking Chenile services through interfaces rather than hand-written transport code.
- Supports both local and remote interaction patterns.

Modules:
- `chenile-proxy`

### `chenile-security`

Role:
- Security-specific support for the Chenile ecosystem.

Modules:
- `chenile-security`
- `chenile-security-api`
- `cucumber-sec-utils`
- `security-interceptor`

### `chenile-messaging`

Role:
- Messaging and pub-sub integrations for Chenile services.

Modules:
- `chenile-pub-sub`
- `cucumber-mqtt-utils`
- `chenile-mqtt`
- `cloud-edge-switch`
- `chenile-kafka`
- `chenile-azure`
- `chenile-jvm-pub-sub`

### `chenile-bdd`

Role:
- Integration-test and BDD support for the Chenile framework.

Modules:
- `it-cucumber-utils`
- `it-cucumber-sec-utils`

### `chenile-others`

Role:
- Miscellaneous entry points and supporting integrations that do not fit the core, security, or messaging repositories.

Modules:
- `chenile-filewatch`
- `chenile-scheduler`
- `chenile-cache`
- `chenile-config-maven-plugin`

### `chenile-process-management`

Role:
- Process orchestration for long-running parent and child processes.

Modules:
- `process-api`
- `process-service`
- `process-delegate`
- `process-utils`
- `q-based-process-starter`
- `invm-process-starter`

Primary group:
- `org.chenile.orchestrator.process`

### `cconfig`

Role:
- Modular configuration system for Chenile applications.

Modules:
- `cconfig-api`
- `cconfig-service`

Primary group:
- `org.chenile.cconfig`

## How These Repositories Fit Together

Typical layering:

1. `chenile-parent` defines common versions and dependency management.
2. `chenile-core` provides the shared runtime base.
3. `chenile-query-workflow-blueprints` and `chenile-process-management` build higher-level application patterns.
4. `chenile-service-registry`, `chenile-proxies`, `chenile-security`, and `chenile-messaging` add integration capabilities around runtime interaction.
5. `chenile-bdd` and `chenile-others` provide testing and auxiliary operational entry points.
6. `cconfig` supplies modular runtime configuration that can be used by applications built on the rest of the stack.

## Release Note

These repositories are versioned together through `chenile-parent` and are currently aligned on `2.1.14`.
