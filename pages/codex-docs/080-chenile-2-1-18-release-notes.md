---
title: Chenile 2.1.18 Release Notes
keywords: chenile 2.1.18 release notes contextcontainer cconfig service registry proxies
tags: [chenile release notes contextcontainer cconfig service-registry proxies]
sidebar: codex_sidebar
permalink: /codex-chenile-2-1-18-release-notes.html
folder: codex-docs
summary: Release notes for Chenile 2.1.18 covering ContextContainer concurrency coverage, service-registry metadata hardening, cconfig build stabilization, and release/doc alignment.
---

Chenile `2.1.18` consolidates the work that landed across the framework repos after the `2.1.17` line and aligns the release markers, build verification, and documentation around that state.

## Highlights

### Core and runtime improvements

- `ContextContainer` now has an explicit concurrent-isolation test in `chenile-core` that proves request headers do not bleed across threads when requests are executed independently through `ChenileEntryPoint`.
- The Codex-authored architecture docs now spell out the safe usage model for `ContextContainer`: thread-confined request handling is safe, but cross-thread propagation still requires explicit handling.

### Service registry and proxy hardening

- `chenile-service-registry` now ignores null or blank parameterized output references when deserializing remote operation metadata.
- This removes the noisy startup warning path for normal non-generic return types and keeps Chenile proxy metadata handling cleaner.
- Documentation now includes a dedicated guide for `chenile-service-registry` and `chenile-proxies`, including concrete examples of replacing direct `RestClient` calls with `ProxyBuilder`-based service proxies.

### Cconfig stabilization

- `cconfig` remains on the `chenile-config`, `cconfig-db`, and `cconfig-tests` module layout introduced earlier, but `2.1.18` includes the follow-up fixes needed to keep that layout buildable.
- `CconfigClientImpl` now reads the tenant header through `ContextContainer.CONTEXT_CONTAINER`, which fixes the non-static access regression exposed during the release build.
- `CconfigClientOwizTest` was aligned with the current `CconfigClientImpl` shape so the OWIZ-based test suite no longer reflects against deleted fields.

### Release alignment

- The standard 11 Chenile repositories are aligned on `2.1.18`.
- `chenile-javadoc` is aligned to the same parent release.
- The main documentation sidebars, tutorial sidebar, developer sidebar, and Codex docs sidebar are all updated to `2.1.18`.

## Upgrade notes

- The main Chenile repositories now resolve to `2.1.18` through `chenile-parent`.
- `git describe --tags` should now return `2.1.18` across the tagged standard release repos.
- `chenile-gen` was intentionally excluded from the full Maven build verification run because its repo root is not a Maven project root; its actual Maven roots remain `jgen/` and `stmcli/`.

## Documentation updates

The Chenile docs were updated to reflect:

- the `2.1.18` release alignment
- the service-registry/proxy usage guidance
- the clarified `ContextContainer` threading model
- the current status of the `cconfig` module layout and build fixes
