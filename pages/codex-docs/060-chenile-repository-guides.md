---
title: Chenile Repository Guides
keywords: chenile repositories guides per repo
tags: [chenile repositories guides]
sidebar: codex_sidebar
permalink: /codex-chenile-repository-guides.html
folder: codex-docs
summary: Repository-by-repository guide to the primary Chenile modules and where each one fits.
---

## `chenile-parent`

Role:
- Super-parent POM for the Chenile ecosystem
- Aligns framework-wide dependency versions, plugin versions, Java version, and release properties

Why it matters:
- Every other primary Chenile repository inherits from it.
- Release sequencing starts here.

## `chenile-core`

Role:
- Runtime foundation of Chenile

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

## `chenile-query-workflow-blueprints`

Role:
- Main higher-level blueprint repository above `chenile-core`

Modules:
- `query-api`
- `chenile-query-service`
- `chenile-query-controller`
- `workflow-api`
- `workflow-service`
- `cucumber-workflow-utils`
- `workflow-utils`
- `stm-generate-puml`

## `chenile-service-registry`

Role:
- Registry layer for service discovery, lookup, and delegate-style interaction support

Modules:
- `service-registry-api`
- `service-registry-service`
- `service-registry-delegate`

## `chenile-proxies`

Role:
- Interface-based proxying for Chenile services

Modules:
- `chenile-proxy`

## `chenile-security`

Role:
- Chenile security stack: API contracts, runtime support, interceptors, and test helpers

Modules:
- `chenile-security`
- `chenile-security-api`
- `cucumber-sec-utils`
- `security-interceptor`

## `chenile-messaging`

Role:
- Messaging and pub-sub integrations across multiple transports

Modules:
- `chenile-pub-sub`
- `cucumber-mqtt-utils`
- `chenile-mqtt`
- `cloud-edge-switch`
- `chenile-kafka`
- `chenile-azure`
- `chenile-jvm-pub-sub`

## `chenile-bdd`

Role:
- BDD and integration-test support modules

Modules:
- `it-cucumber-utils`
- `it-cucumber-sec-utils`

## `chenile-others`

Role:
- Auxiliary entry points and supporting integrations

Modules:
- `chenile-filewatch`
- `chenile-scheduler`
- `chenile-cache`
- `chenile-config-maven-plugin`

## `chenile-process-management`

Role:
- Long-running parent and child process orchestration

Modules:
- `process-api`
- `process-service`
- `process-delegate`
- `process-utils`
- `q-based-process-starter`
- `invm-process-starter`

## `cconfig`

Role:
- Modular configuration system for Chenile applications

Modules:
- `cconfig-api`
- `cconfig-service`
