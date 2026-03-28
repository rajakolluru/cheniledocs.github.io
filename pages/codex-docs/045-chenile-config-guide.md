---
title: Chenile Config Guide
keywords: chenile cconfig config owiz overrides
tags: [chenile cconfig config]
sidebar: codex_sidebar
permalink: /codex-chenile-config-guide.html
folder: codex-docs
summary: How Chenile Config works today with OWIZ orchestration, ConfigContext, resource-aware loaders, and the built-in JSON, DB, properties, message-bundle, and environment config commands.
---

This guide documents `cconfig`, the Chenile modular configuration system, with emphasis on the current OWIZ-based runtime flow, the built-in configuration commands, and the file/resource lookup conventions.

## What `cconfig` does

`cconfig` lets a Chenile application define configuration as module JSON on the classpath and then progressively enrich or override that configuration at runtime.

The main ideas are:

- each configuration belongs to a module such as `payments`, `payments.rules`, or `ctest`
- base values usually come from a JSON file on the classpath
- later sources can replace a full key or mutate a nested path inside a JSON value
- overrides can be selected by a custom attribute, which defaults to the Chenile tenant id header
- the orchestration of those sources is explicit in OWIZ XML instead of being hardcoded into retriever ordering logic

## Repository structure

The repository contains two modules:

- `chenile-config`
- `cconfig-db`

`chenile-config` holds the SDK client implementation, the OWIZ command types used for config loading, and utility classes. `cconfig-db` provides the database-backed config command and the production OWIZ orchestration.

## Current package layout

The current design is split into four main packages:

- `org.chenile.cconfig.spi`
- `org.chenile.cconfig.sdk.impl`
- `org.chenile.cconfig.util`
- `org.chenile.cconfig.service.impl`

The SPI package contains:

- `ConfigContext`
- `KeyManipulatingConfigRetriever`

The SDK implementation package contains:

- `CconfigClientImpl`
- `JsonBasedCconfigRetriever`
- `PropertiesBasedCconfigRetriever`
- `EnvBasedCconfigRetriever`
- `MessageBundleConfigRetriever`

The utility package contains:

- `ExpressionSupport`
- `ResourceSupport`

The service implementation package contains:

- `DbBasedCconfigRetriever`

## Runtime flow

`CconfigClientImpl` resolves a configuration value through `ConfigContext` and an OWIZ orchestration.

The flow is:

1. Build a `ConfigContext(module, customAttribute)`.
2. Look in `MemoryCache` for the resolved module map.
3. Execute an `OrchExecutor<ConfigContext>`.
4. Let each OWIZ command mutate or enrich `configContext.allKeys`.
5. Cache the resulting `configContext.allKeys`.
6. Return either the full module map or the selected key.

The default customization attribute comes from `chenile-tenant-id`, which is read from the Chenile request context.

## OWIZ orchestration model

`cconfig` no longer uses a retriever factory or an `order()` contract. The composition is now defined in OWIZ XML.

The production orchestration in `cconfig-db` is:

```xml
<flows>
    <flow>
        <chain>
            <json-based-cconfig-retriever/>
            <db-based-cconfig-retriever/>
            <properties-based-cconfig-retriever/>
            <message-bundle-config-retriever/>
            <env-based-cconfig-retriever/>
        </chain>
    </flow>
</flows>
```

This keeps orchestration concerns outside the individual config commands. If the sequence changes, the XML changes, not the command API.

## OWIZ tag convention

OWIZ supports a useful Spring bean naming convention:

- a Spring bean named `jsonBasedCconfigRetriever` can be used in OWIZ XML as `<json-based-cconfig-retriever/>`
- a Spring bean named `messageBundleConfigRetriever` can be used as `<message-bundle-config-retriever/>`

This means normal Spring bean names can be referenced directly in OWIZ XML without `add-command-tag`, as long as the XML tag is the hyphenated form of the camel-case bean name.

## Built-in config commands

### `JsonBasedCconfigRetriever`

- lives in `chenile-config`
- is the baseline config loader
- loads module JSON from a configured classpath folder
- uses `ResourceSupport.resourceLoader(...)` so it first checks a customization-specific JSON path and then falls back to the base JSON path
- maps module names to JSON resources
  - `ctest` -> `.../ctest.json`
  - `ctest1.ctest1` -> `.../ctest1/ctest1.json`
- replaces `configContext.allKeys` with the parsed module map

This command establishes the starting key set for the module.

### `PropertiesBasedCconfigRetriever`

This command lives in `chenile-config` and extends `KeyManipulatingConfigRetriever`.

It:

- treats the configured `propertiesPath` as a folder, not a file
- derives the actual properties file name from the module
  - module `m1` -> `m1.properties`
- uses `ResourceSupport`
- first checks `<propertiesPath>/<customAttribute>/<module>.properties`
- then falls back to `<propertiesPath>/<module>.properties`
- reads entries of the form `module.key=value`
- also supports nested-path overrides in the form `module.key.path.to.node=value`
- converts matching entries for the current module into `Cconfig` records
- relies on `KeyManipulatingConfigRetriever` and `ExpressionSupport` to apply those records

This is useful for file-based overrides that should behave like database `Cconfig` rows without requiring a database.

### `DbBasedCconfigRetriever`

This is the service-side command and extends `KeyManipulatingConfigRetriever`.

It:

- queries runtime overrides from the database
- includes both `__GLOBAL__` and the request-specific customization attribute
- returns `List<Cconfig>` from `retrieveCconfigs(...)`
- relies on `KeyManipulatingConfigRetriever` and `ExpressionSupport` to apply those overrides to `configContext.allKeys`

This is the right pattern when a source naturally returns `Cconfig` rows rather than directly mutating the resolved map.

### `MessageBundleConfigRetriever`

This command lives in `chenile-config` and augments keys from Spring message bundles.

It:

- scans configured message bundle property files
- looks for keys in the forms `module.key`, `__GLOBAL__.module.key`, and `customAttribute.module.key`
- builds locale-aware maps from those bundle entries
- treats `module.key` as the default message key
- lets `__GLOBAL__.module.key` override that default
- lets `customAttribute.module.key` override both
- adds those values into `configContext.allKeys` without replacing existing non-bundle values

This is intended for i18n-style configuration values where the resolved value is a locale map rather than a single scalar.

### `EnvBasedCconfigRetriever`

This command lives in `chenile-config` and reads overrides from environment variables.

It:

- uses the key combinations already known in `ConfigContext`
- looks for environment entries named `{customAttribute}_{module}_{key}`
- also checks `__GLOBAL___{module}_{key}`
- emits pathless `Cconfig` values so the normal merge logic applies
- overrides known keys rather than inventing arbitrary new ones

This makes environment overrides a late-stage source in the default orchestration.

### `ResourceSupport`

`ResourceSupport` is the shared classpath lookup utility used by commands that read resources from the classpath.

Its static method:

- `resourceLoader(basePath, resourceName, customAttribute)`

behaves like this:

1. try `<basePath>/<customAttribute>/<resourceName>`
2. if not found, try `<basePath>/<resourceName>`
3. if neither exists, return `null`

This gives JSON and properties loaders a consistent customization-aware classpath lookup path.

## Override semantics

`cconfig` still supports two kinds of mutation:

### Full-value overrides

If a command applies or returns a record with no `path`, the full key value is replaced.

### Path-based overrides

If a command returns a `Cconfig` with a `path`, the existing expression-based logic updates only that nested location.

Example:

- base JSON defines `key2.fields.field1.range`
- runtime override can add or replace `fields.field2`
- runtime override can replace a scalar like `abc`

In the current default orchestration:

- `JsonBasedCconfigRetriever` establishes the starting key set
- `DbBasedCconfigRetriever` can replace existing values, add new values, or mutate nested paths
- `PropertiesBasedCconfigRetriever` can add or override keys from classpath properties files and can apply nested path updates
- `MessageBundleConfigRetriever` can add locale-aware values for message-driven keys
- `EnvBasedCconfigRetriever` overrides known keys from the environment

## How to add a new config source

To add another override source:

1. Implement a normal OWIZ `Command<ConfigContext>`.
2. If the source naturally produces `List<Cconfig>`, extend `KeyManipulatingConfigRetriever` and implement `retrieveCconfigs(...)`.
3. If the source directly mutates the resolved map, update `configContext.allKeys` in `execute(...)`.
4. Register the command as a Spring bean.
5. Place it in the desired sequence in the OWIZ XML.

This keeps the orchestration explicit and decoupled from the individual config commands.

## Testing approach

The current flow is covered by tests in both modules:

- OWIZ-based orchestration tests verify the multi-command merge flow
- `ResourceSupport` tests verify customization-specific resource lookup with fallback
- properties tests verify that module-derived `*.properties` files map correctly into `Cconfig` records
- message-bundle tests verify locale-aware config extraction
- env tests verify environment overrides over already-discovered keys

The OWIZ tests also verify that the XML bean-tag DSL works with hyphenated Spring bean names such as `<json-based-cconfig-retriever/>`.
