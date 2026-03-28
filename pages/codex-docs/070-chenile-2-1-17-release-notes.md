---
title: Chenile 2.1.17 Release Notes
keywords: chenile 2.1.17 release notes mcp cconfig owiz
tags: [chenile release notes mcp cconfig owiz]
sidebar: codex_sidebar
permalink: /codex-chenile-2-1-17-release-notes.html
folder: codex-docs
summary: Release notes for Chenile 2.1.17 covering MCP enhancements, blueprint updates, the cconfig OWIZ refactor, module renames, and documentation alignment.
---

Chenile `2.1.17` focuses on three main areas:

- richer MCP integration across core runtime and generated services
- a substantial `cconfig` refactor toward OWIZ-native orchestration
- documentation alignment for OWIZ, configuration, and release maintenance

## Highlights

### MCP improvements

- `chenile-mcp` now includes return-value information in generated tool definitions.
- Polymorphic MCP variants can now provide either a Java `TypeReference` or an explicit JSON schema for parameters.
- Tool description precedence now favors polymorph-variant descriptions over generic controller-level MCP descriptions, so query metadata descriptions are surfaced correctly.
- Query MCP integration in `chenile-query-service` now exposes one variant per query definition and builds filter schemas from filterable `ColumnMetadata`.

### Blueprint and generator support

- `bp-wfservice`, `bp-wfcustom`, and `bp-service` now support an `enableMCP` input that conditionally adds MCP wiring to generated services.
- `bp-minimonolith` now supports MCP runtime dependencies and `application.yml` MCP configuration for generated monoliths.
- Workflow service generation now supports `processIdPolymorph` where appropriate.

### Cconfig refactor

- `cconfig` orchestration is now OWIZ-native and based on `ConfigContext` rather than retriever ordering or a retriever factory.
- JSON, database, properties, message-bundle, and environment config loaders are now composed explicitly in OWIZ XML.
- OWIZ XML now uses the native Spring bean-name DSL convention, for example `<json-based-cconfig-retriever/>`, without requiring `add-command-tag`.
- `ResourceSupport.resourceLoader(...)` provides customization-aware classpath resource lookup.
- `PropertiesBasedCconfigRetriever` now resolves module-specific `*.properties` files from a configured folder.
- `MessageBundleConfigRetriever` adds locale-aware configuration values from Spring message bundles.
- `cconfig-api` has been renamed to `chenile-config`.
- `cconfig-service` has been renamed to `cconfig-db`.
- All `cconfig` tests now live in a dedicated `cconfig-tests` module so production modules stay test-free.

### Other changes

- `agentiq-poc/client` now supports Claude in addition to Gemini and Ollama.
- `process-service` build stability was improved by adding an explicit plugin version for `stm-generate-puml`.
- `chenile-javadoc` is aligned with the current Chenile parent version.

## Upgrade notes

- The main Chenile repositories are aligned to `2.1.17`.
- The `cconfig` module names and artifactIds changed:
  - `org.chenile.cconfig:cconfig-api` -> `org.chenile.cconfig:chenile-config`
  - `org.chenile.cconfig:cconfig-service` -> `org.chenile.cconfig:cconfig-db`
- Consumers depending on the old `cconfig` artifactIds should update their Maven dependencies.
- OWIZ users can now rely on the hyphenated Spring bean-name convention directly in XML DSLs.

## Documentation updates

The Chenile docs were updated to reflect:

- the OWIZ bean-name tag convention
- the current `cconfig` orchestration model
- the renamed `cconfig` modules
- the new `2.1.17` release alignment
