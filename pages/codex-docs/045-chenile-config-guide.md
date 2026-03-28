---
title: Chenile Config Guide
keywords: chenile cconfig config retriever factory overrides
tags: [chenile cconfig config]
sidebar: codex_sidebar
permalink: /codex-chenile-config-guide.html
folder: codex-docs
summary: How Chenile Config works, how the current retriever SPI is structured, and how JSON, DB, and environment override sources are applied in order.
---

This guide documents `cconfig`, the Chenile modular configuration system, with emphasis on the current retriever SPI, runtime flow, and built-in override sources.

## What `cconfig` does

`cconfig` lets a Chenile application define configuration as module JSON on the classpath and then override that configuration at runtime.

The main ideas are:

- each configuration belongs to a module such as `payments`, `payments.rules`, or `ctest`
- base values come from a JSON file on the classpath
- runtime overrides can replace a full key or mutate a nested path inside a JSON value
- overrides can be selected by a custom attribute, which defaults to the Chenile tenant id header

## Repository structure

The repository contains two modules:

- `cconfig-api`
- `cconfig-service`

`cconfig-api` holds the public SPI, SDK client implementation, and built-in API-level retrievers. `cconfig-service` provides the service-side database retriever and runtime wiring.

## Current package layout

The current design is split into three layers:

- `org.chenile.cconfig.spi`
- `org.chenile.cconfig.sdk.impl`
- `org.chenile.cconfig.service.impl`

The SPI package contains:

- `ConfigContext`
- `CconfigRetriever`
- `CconfigRetrieverFactory`
- `KeyManipulatingConfigRetriever`

The SDK implementation package contains:

- `CconfigClientImpl`
- `CconfigRetrieverFactoryImpl`
- `JsonBasedCconfigRetriever`
- `EnvBasedCconfigRetriever`

The service implementation package contains:

- `DbBasedCconfigRetriever`

## Runtime flow

`CconfigClientImpl` now resolves a configuration value through `ConfigContext`.

The flow is:

1. Build a `ConfigContext(module, customAttribute)`.
2. Look in `MemoryCache` for the resolved module map.
3. Ask `CconfigRetrieverFactory` for all registered retrievers in `order()` sequence.
4. Call `augmentKeys(configContext)` on each retriever.
5. Cache `configContext.allKeys`.
6. Return either the full module map or the selected key.

The default customization attribute comes from `chenile-tenant-id`, which is read from the Chenile request context.

## Retriever factory model

`cconfig` now uses a shared `CconfigRetrieverFactory` instead of assuming there is exactly one retriever.

The design is:

- `CconfigRetrieverFactory` registers retriever instances
- retrievers register themselves with the factory at startup
- `CconfigClientImpl` asks the factory for all retrievers and invokes them in order
- retrievers are sorted by `order()`

Lower `order()` means lower precedence. Higher `order()` retrievers run later and can override values established by earlier retrievers.

## Built-in retrievers

### `JsonBasedCconfigRetriever`

- lives in `cconfig-api`
- is the baseline retriever
- loads the module JSON from the configured classpath path
- replaces `configContext.allKeys` with the parsed module map
- runs first with `order() == -1`

This retriever establishes the initial config map for the module.

### `DbBasedCconfigRetriever`

This is the service-side retriever and extends `KeyManipulatingConfigRetriever`.

It:

- queries runtime overrides from the database
- includes both `__GLOBAL__` and the request-specific customization attribute
- self-registers with the factory in `@PostConstruct`
- returns `List<Cconfig>` from `retrieveCconfigs(...)`
- relies on `KeyManipulatingConfigRetriever` and `ExpressionSupport` to apply those overrides to `configContext.allKeys`

This is the right pattern when a retriever naturally returns `Cconfig` rows rather than directly mutating the resolved map.

### `EnvBasedCconfigRetriever`

This retriever lives in `cconfig-api` and directly mutates `configContext.allKeys`.

It:

- scans the current keys already present in `configContext.allKeys`
- looks for an environment entry named `{customAttribute}_{module}_{key}`
- if present, fully replaces that key value
- does not add brand new keys
- does not perform path-level mutation
- runs late with `order() == 10`

This makes environment overrides the highest-precedence built-in source in the current chain.

## Override semantics

`cconfig` still supports two kinds of mutation:

### Full-value overrides

If a retriever applies or returns a record with no `path`, the full key value is replaced.

### Path-based overrides

If a retriever returns a `Cconfig` with a `path`, the existing expression-based logic updates only that nested location.

Example:

- base JSON defines `key2.fields.field1.range`
- runtime override can add or replace `fields.field2`
- runtime override can replace a scalar like `abc`

In the current implementation:

- `JsonBasedCconfigRetriever` establishes the starting key set
- `DbBasedCconfigRetriever` can replace existing values, add new values, or mutate nested paths
- `EnvBasedCconfigRetriever` only overrides keys that already exist in `configContext.allKeys`

## How to add a new retriever

To add another override source:

1. Choose the retriever style.
2. If the source directly mutates the resolved map, implement `CconfigRetriever` and update `ConfigContext` in `augmentKeys(...)`.
3. If the source naturally produces `List<Cconfig>`, extend `KeyManipulatingConfigRetriever` and implement `retrieveCconfigs(...)`.
4. Provide an `order()` if the retriever should run above or below existing retrievers.
5. Register the retriever with `CconfigRetrieverFactory` during startup.

This keeps the client orchestration simple while allowing multiple override sources such as database, remote config, file-based overlays, or environment-specific adapters.

## Testing approach

The retriever flow is covered by unit tests in `cconfig-service`:

- one test proves multiple retrievers apply in precedence order
- one test proves the single-retriever path still behaves the same
- one test proves the JSON retriever sorts first
- one test proves the env retriever overrides lower-precedence sources for known keys

The tests use the existing `ctest.json` fixture so the behavior is validated against both scalar replacement and nested JSON path mutation.
