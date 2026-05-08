---
title: Chenile 2.1.20 Release Notes
keywords: chenile 2.1.20 release notes service registry jgen minimonolith
tags: [chenile release notes service registry jgen]
sidebar: codex_sidebar
permalink: /codex-chenile-2-1-20-release-notes.html
folder: codex-docs
summary: Release notes for Chenile 2.1.20 covering service-registry improvements, jgen enhancements, build verification, and documentation updates.
---

Chenile `2.1.20` rolls the framework family forward from `2.1.19` and captures the framework work that landed after the `2.1.19` tag, along with the release alignment, full build verification, and documentation refresh for this version.

## Highlights

### Release and build verification

- The standard 11 Chenile repositories are aligned on `2.1.20`.
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

### Service registry improvements

- `ServiceRegistryCache` now has a real deep equality check for service definitions, operation definitions, and params.
- The service-registry `exists()` behavior is now configurable through `enforceImmutableServiceVersions`.
- When immutable service versions are enforced, the cache can treat `(serviceId, serviceVersion)` as the identity check instead of doing a full deep comparison.
- Metadata handling was also hardened so normal non-parameterized operation outputs do not trigger noisy `outputAsStringReference` parsing warnings during registry deserialization.

### Generator enhancements

- `jgen` now supports `${...}` substitution across captured input values, so blueprint defaults can derive from earlier fields.
- `jgen` now supports `RECORD_ARRAY` inputs for repeated structured records.
- `bp-minimonolith` now uses that feature for additional Maven dependency records, including conditional validation around dependency name, group, and version.
- `bp-minimonolith` also gained better support for:
  - hosted service registry
  - service-registry delegate mode with required remote registry URL
  - richer MCP server naming and instruction inputs
  - optional query controller support
  - optional H2 console support

### Core and documentation updates

- `chenile-core` now includes an executor-based concurrent test that validates `ContextContainer` request isolation across threads when requests stay thread-confined.
- The Codex docs now document `ContextContainer` thread-local behavior more explicitly.
- The docs set also now includes dedicated guidance for:
  - `chenile-service-registry`
  - `chenile-service-registry` with `chenile-proxies`
  - the newer `chenile-gen` and mini-monolith inputs

## Upgrade notes

- The main Chenile repositories now resolve to `2.1.20` through `chenile-parent`.
- `git describe --tags` returns `2.1.20` across the standard tagged release repositories after the annotated tags are created and pushed.
- `chenile-gen` remains a release follow-up repository rather than part of the standard 11, but its generated blueprint and input-model behavior is now part of the practical release surface that maintainers should verify.

## Documentation updates

The Chenile docs were updated to reflect:

- the `2.1.20` release alignment
- the new `2.1.20` release notes page
- the updated sidebar versions across the docs site
- the current release baseline in the architecture and modules overview pages
- the newer service-registry and generator guidance
