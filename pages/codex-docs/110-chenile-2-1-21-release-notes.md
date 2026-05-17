---
title: Chenile 2.1.21 Release Notes
keywords: chenile 2.1.21 release notes admin ui version metadata service registry
tags: [chenile release notes admin-ui service-registry versioning]
sidebar: codex_sidebar
permalink: /codex-chenile-2-1-21-release-notes.html
folder: codex-docs
summary: Release notes for Chenile 2.1.21 covering version metadata, chenile-admin-ui, service-registry ecosystem visibility, build verification, and documentation updates.
---

Chenile `2.1.21` rolls the framework family forward from `2.1.20` and captures the framework work that landed after the `2.1.20` tag, along with the release alignment, full build verification, and documentation refresh for this version.

## Highlights

### Release and build verification

- The standard 11 Chenile repositories are aligned on `2.1.21`.
- `chenile-javadoc` is aligned to the same parent release.
- `chenile-gen` continues to default generated projects to the current Chenile release baseline.
- A full `mvn install` run completed successfully for the release set:
  - `chenile-parent`
  - `chenile-core`
  - `chenile-query-workflow-blueprints`
  - `chenile-service-registry`
  - `chenile-proxies`
  - `chenile-security`
  - `chenile-messaging`
  - `chenile-bdd`
  - `chenile-others`
  - `chenile-process-management`
  - `cconfig`
  - `chenile-javadoc`
- `chenile-gen` also built successfully from its actual Maven root at `chenile-gen/jgen`.

### Core runtime and version metadata

- `chenile-core` now aggregates version properties from every classpath resource ending in `version.txt` instead of keeping only one version value in memory.
- `ChenileConfiguration` now supports `getVersion("xxx")`, which resolves `xxx.version`.
- Services can now declare an optional `versionProperty`, both in service JSON and in `@ChenileController`.
- `versionProperty` now defaults from the service ID when it is not declared explicitly.
- The built-in `infoService` now resolves its service version from `chenile.version`.

### Monolith naming transition

- `chenile.monolith.name` is now the primary runtime property for monolith identity.
- `chenile.module.name` still works as a deprecated compatibility fallback.
- `chenile-gen` templates and framework test resources now generate and validate `chenile.monolith.name` by default.
- Core runtime APIs now expose `getMonolithName()` while keeping `getModuleName()` as a compatibility alias.
- Public JSON payloads emitted by `chenile-core` and `chenile-service-registry` now use `monolithName`.
- Incoming JSON that still sends `moduleName` is accepted for compatibility during the transition window.

### Chenile Admin UI

- `chenile-core` now contains `chenile-admin-ui`, a standalone React frontend for inspecting running Chenile systems.
- The UI can query `/info`, `/service-info/{service}`, and `/health-check/{service}` from a target monolith.
- When it detects a central `service-registry-service`, it can also list the wider service ecosystem through `/serviceregistry`.
- The UI also surfaces a Swagger or OpenAPI link when the target server exposes standard docs endpoints.

### Service registry ecosystem visibility

- `chenile-service-registry` now exposes a central listing API for the full registered ecosystem.
- The central registry can aggregate local services and services registered by delegate-enabled monoliths that publish through `chenile.remote.service.registry`.
- Remote registry metadata now includes health-check exposure so ecosystem tooling can decide when a health probe is available.

## Upgrade notes

- The main Chenile repositories now resolve to `2.1.21` through `chenile-parent`.
- `git describe --tags` should return `2.1.21` across the standard tagged release repositories after the annotated tags are created and pushed.
- `chenile-gen` remains a release follow-up repository rather than part of the standard 11, but its generated defaults should stay aligned with the active Chenile baseline.
- Applications should start moving their `chenile.properties` files from `chenile.module.name` to `chenile.monolith.name`.
- Consumers of `/info`, `/service-info`, and service-registry payloads should switch to `monolithName`. `moduleName` remains accepted on input, but new output now prefers `monolithName`.

## Documentation updates

The Chenile docs were updated to reflect:

- the `2.1.21` release alignment
- the new `2.1.21` release notes page
- the updated sidebar versions across the docs site
- the current release baseline in the architecture and modules overview pages
- the `chenile-admin-ui` guide and its ecosystem mode
- the current `chenile-gen` example dependency version
- the `chenile.monolith.name` transition and `monolithName` payload shape
