---
title: Chenile 2.1.17 Release Notes
keywords: chenile 2.1.17 release notes mcp cconfig owiz
tags: [chenile release notes mcp cconfig owiz]
sidebar: codex_sidebar
permalink: /codex-chenile-2-1-17-release-notes.html
folder: codex-docs
summary: Release notes for Chenile 2.1.17 covering MCP enhancements, blueprint updates, the cconfig OWIZ refactor, module renames, and documentation alignment.
---

Chenile `2.1.17` focuses on four main areas:

- richer MCP integration across core runtime and generated services
- a substantial `cconfig` refactor toward OWIZ-native orchestration
- release and repository alignment across the Chenile build, docs, and generators
- `agentiq-poc` improvements for provider support, compacted memory, and case-aware conversations
- documentation alignment for OWIZ, configuration, and release maintenance

## Highlights

### MCP improvements

- `chenile-mcp` now includes return-value information in generated tool definitions.
- Polymorphic MCP variants can now provide either a Java `TypeReference` or an explicit JSON schema for parameters.
- Tool description precedence now favors polymorph-variant descriptions over generic controller-level MCP descriptions, so query metadata descriptions are surfaced correctly.
- Query MCP integration in `chenile-query-service` now exposes one variant per query definition and builds filter schemas from filterable `ColumnMetadata`.
- `ProcessIdPolymorph` and related workflow/query MCP generation paths were aligned with the newer polymorph contract.

### Blueprint and generator support

- `bp-wfservice`, `bp-wfcustom`, and `bp-service` now support an `enableMCP` input that conditionally adds MCP wiring to generated services.
- `bp-minimonolith` now supports MCP runtime dependencies and `application.yml` MCP configuration for generated monoliths.
- Workflow service generation now supports `processIdPolymorph` where appropriate.
- `chenile-gen` now keeps the default Chenile version in `jgen-base/config.json` aligned during release bumps.

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
- Case-specific resource lookup for config loading is now centralized through `ResourceSupport.resourceLoader(...)`, which first checks `<base>/<customAttribute>/<resource>` and then falls back to the base resource.

### Release and repo maintenance

- The standard 11 Chenile repositories were upgraded through `2.1.14`, `2.1.15`, `2.1.16`, and `2.1.17`.
- Release flow now consistently includes:
  - root `pom.xml` and `*-version.txt` bumps
  - `mvn install` verification across all release repos
  - annotated tags and `git describe` validation
  - `make deploy` sequencing with `chenile-parent` published first
  - follow-up updates in `chenile-javadoc`, `cheniledocs.github.io`, and `chenile-gen`
- Chenile docs sidebars and product sidebars were aligned to the current release.

### Other changes

- `agentiq-poc/client` now supports Claude in addition to Gemini and Ollama.
- `agentiq-poc/client` now uses a hybrid chat-memory model:
  - `Run` remains the business/audit record
  - Spring AI messages are persisted separately for advisor-driven memory
  - a compacting advisor condenses long histories before they are injected back into prompts
- `agentiq-poc/client` now supports optional `caseId` handling in the UI and API, and returns the resolved `caseId` in answers.
- Case-linked conversation memory moved to a dedicated server module:
  - `server/casehistory/casehistory-api`
  - `server/casehistory/casehistory-service`
- Case history is exposed via Chenile/MCP on the server and proactively fetched by the client advisor when a case is already known.
- Case history save input now uses a dedicated DTO and no longer persists `assistantMessage`.
- Agents can now reference an optional classpath markdown file that is appended to the effective system prompt.
- The client now exposes the H2 console for local inspection during development.
- `process-service` build stability was improved by adding an explicit plugin version for `stm-generate-puml`.
- `chenile-javadoc` is aligned with the current Chenile parent version.

## Upgrade notes

- The main Chenile repositories are aligned to `2.1.17`.
- The `cconfig` module names and artifactIds changed:
  - `org.chenile.cconfig:cconfig-api` -> `org.chenile.cconfig:chenile-config`
  - `org.chenile.cconfig:cconfig-service` -> `org.chenile.cconfig:cconfig-db`
- Consumers depending on the old `cconfig` artifactIds should update their Maven dependencies.
- OWIZ users can now rely on the hyphenated Spring bean-name convention directly in XML DSLs.
- Generator consumers should rerun blueprint output if they want the new MCP-aware templates and default version alignment.
- `agentiq-poc` users should be aware that case history now lives in the dedicated `casehistory` server module rather than under `collectioncase`.

## Documentation updates

The Chenile docs were updated to reflect:

- the OWIZ bean-name tag convention
- the current `cconfig` orchestration model
- the renamed `cconfig` modules
- the new `2.1.17` release alignment
- the expanded release workflow, sidebar updates, and generator version bump step
- the `agentiq-poc` case-aware chat and case-history architecture
