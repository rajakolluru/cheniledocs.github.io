---
title: Chenile Dependency Diagram
keywords: chenile dependency diagram repos layers
tags: [chenile dependency architecture]
sidebar: codex_sidebar
permalink: /codex-chenile-dependency-diagram.html
folder: codex-docs
summary: Repository-level dependency and release sequencing view for the primary Chenile modules.
---

## Repository Dependency Layers

```text
                           +------------------+
                           |  chenile-parent  |
                           |  super-parent    |
                           +------------------+
                                     |
         -----------------------------------------------------------------
         |               |                 |               |               |
         v               v                 v               v               v
 +----------------+  +-------------------------------+  +----------------------+  +------------------+  +-----------+
 | chenile-core   |  | chenile-query-workflow-      |  | chenile-service-     |  | chenile-proxies  |  | cconfig   |
 | core runtime   |  | blueprints                    |  | registry             |  | interface proxy  |  | config    |
 +----------------+  +-------------------------------+  +----------------------+  +------------------+  +-----------+
         |               |                 |               |               |
         |               v                 |               |               |
         |        +---------------------+  |               |               |
         |        | chenile-process-    |  |               |               |
         |        | management          |  |               |               |
         |        +---------------------+  |               |               |
         |---------------------------------|---------------|---------------|
         |                                 |               |               |
         v                                 v               v               v
 +----------------+                +----------------+  +----------------+  +----------------+
 | chenile-       |                | chenile-       |  | chenile-       |  | chenile-bdd    |
 | security       |                | messaging      |  | others         |  | test support   |
 +----------------+                +----------------+  +----------------+  +----------------+
```

## Reading the diagram

- `chenile-parent` is the common parent and version source for all 10 sibling repositories.
- `chenile-core` is the runtime foundation.
- `chenile-query-workflow-blueprints` is the main higher-level blueprint layer above the core runtime.
- `chenile-process-management` is above the runtime and workflow layer because it orchestrates long-running processes rather than defining the low-level execution model.
- `chenile-service-registry`, `chenile-proxies`, `chenile-security`, and `chenile-messaging` are integration-focused repositories.
- `chenile-bdd`, `chenile-others`, and `cconfig` are supporting repositories.

## Simplified dependency view

```text
chenile-parent
  -> chenile-core
  -> chenile-query-workflow-blueprints
  -> chenile-service-registry
  -> chenile-proxies
  -> chenile-security
  -> chenile-messaging
  -> chenile-bdd
  -> chenile-others
  -> chenile-process-management
  -> cconfig
```

## Release and deploy sequence

```text
1. chenile-parent
   - bump version
   - build/install
   - commit/tag/push
   - make deploy
   - wait until Maven Central shows org.chenile:chenile-parent:<version>

2. chenile-core
3. chenile-query-workflow-blueprints
4. chenile-service-registry
5. chenile-proxies
6. chenile-security
7. chenile-messaging
8. chenile-bdd
9. chenile-others
10. chenile-process-management
11. cconfig
```

Use the dependency view to decide where to start:

- request pipeline, HTTP binding, exchange model, STM basics: `chenile-core`
- query and workflow services: `chenile-query-workflow-blueprints`
- long-running orchestration: `chenile-process-management`
- service lookup: `chenile-service-registry`
- proxy invocation: `chenile-proxies`
- auth and interceptors: `chenile-security`
- messaging: `chenile-messaging`
- test support: `chenile-bdd`
- schedulers, filewatch, cache, config plugin: `chenile-others`
- modular configuration: `cconfig`
