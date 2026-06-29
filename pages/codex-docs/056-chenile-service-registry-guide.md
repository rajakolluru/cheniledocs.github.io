---
title: Chenile Service Registry Guide
keywords: chenile service registry cache delegate initializer remote service definition
tags: [chenile service-registry cache]
sidebar: codex_sidebar
permalink: /codex-chenile-service-registry-guide.html
folder: codex-docs
summary: Dedicated guide to chenile-service-registry covering module roles, startup flow, cache behavior, hosted registry setup, and its relationship to chenile-proxies.
---

This guide documents `chenile-service-registry` itself: what it stores, how it is hosted, how clients read from it, and where its cache and startup behavior fit into a Chenile deployment.

## Purpose

The service registry is Chenile's shared source of truth for remotely invokable Chenile services.

It stores:

- service id
- service version
- base URL
- module name
- operation names
- operation URLs
- HTTP methods
- parameter metadata
- response type metadata
- interceptor metadata needed by remote callers

That metadata lets another Chenile application invoke the service through a Java interface instead of hand-maintaining remote HTTP bindings.

## Repository and modules

Repository:

- `chenile-service-registry`

Modules:

- `service-registry-api`
- `service-registry-service`
- `service-registry-delegate`

## Module roles

### `service-registry-api`

This module defines the shared registry model and the local cache used on both server and client sides.

Key classes:

- `ChenileRemoteServiceDefinition`
- `ChenileRemoteOperationDefinition`
- `ChenileRemoteParamDefinition`
- `ServiceRegistryService`
- `ServiceRegistryCache`

`ServiceRegistryCache` is a near-cache keyed by `(serviceId, serviceVersion)`, and it also tracks the latest known version for each service id.

From `2.1.24` onward, that cache also uses a shared semantic fingerprint so repeated startup publishing does not multiply logically identical entries in memory.

### `service-registry-service`

This module hosts the registry as a Chenile service backed by persistence.

Key responsibilities:

- persist service definitions
- expose lookup endpoints
- warm the in-memory cache from the database at startup
- publish locally hosted Chenile services into the registry

Key classes:

- `ServiceRegistryInitializer`
- `ServiceRegistryServiceImpl`
- `ServiceRegistryRepository`

### `service-registry-delegate`

This module is the remote client for the hosted registry.

Key responsibilities:

- read remote service definitions from the registry host
- keep a local near-cache of those definitions
- hide the raw HTTP calls from higher-level client code

Key class:

- `ServiceRegistryClientImpl`

## Startup flow

### On the registry host

`ServiceRegistryInitializer` does two things when the application is ready:

1. reads all persisted `ChenileRemoteServiceDefinition` rows from the database and loads them into `ServiceRegistryCache`
2. walks the local `ChenileConfiguration`, converts each local `ChenileServiceDefinition` into a `ChenileRemoteServiceDefinition`, and saves it through `ServiceRegistryService`

That means the registry starts with persisted state and then republishes the local runtime view of the currently hosted services.

From `2.1.24` onward, that republish step is intentionally idempotent:

- republishing the same definition reuses the existing logical service version
- republishing a changed definition without bumping `serviceVersion` logs a warning and keeps the existing canonical row
- concurrent inserts for the same service version are resolved by the database uniqueness constraint plus a reload path in the service layer

### On a remote client

The client includes `service-registry-delegate` and configures:

```yaml
chenile:
  remote:
    service:
      registry: http://localhost:8000
```

`ServiceRegistryClientImpl` then:

1. checks the local `ServiceRegistryCache`
2. if absent, calls the remote registry host
3. stores the response in the local cache
4. returns the cached metadata to the caller

## Cache behavior

`ServiceRegistryCache` stores definitions by exact `(serviceId, serviceVersion)` and also stores the latest version for each service id.

This supports two retrieval styles:

- exact version lookup
- latest-version lookup by service id

The cache also performs a deep equality check before accepting that a definition is unchanged. That comparison covers:

- base URL
- service id
- service version
- module name
- client interceptors
- operations
- operation params
- operation output metadata

This matters because Chenile treats `(serviceId, version)` as immutable, so if a service definition changes without a version bump, the registry should treat it as changed rather than silently assuming equality.

The latest-version cache also now compares dotted numeric versions numerically. This prevents incorrect ordering such as `2.1.9` being treated as newer than `2.1.10`.

## Persistence contract and database upgrade

The hosted registry persists `ChenileRemoteServiceDefinition` rows in `service_definition`.

From `2.1.24`, the persistence model expects:

- `service_id` to be non-null
- `service_version` to be non-null
- a unique key on `(service_id, service_version)`

Constraint name:

- `uk_service_definition_service_version`

Why this matters:

- the registry now enforces the immutability of a published service version at the database boundary
- restarts or redeployments should not generate a second row for the same logical service version
- accidental same-version mutations are surfaced as warnings instead of being silently stored as a second record

Upgrade guidance for an existing registry database:

1. Deploy the `2.1.24` registry code.
2. Run `GET /serviceregistry/diagnostics`.
3. Remove duplicate or invalid rows from `service_definition`.
4. Only then apply the non-null and unique constraints.

Example duplicate-discovery SQL:

```sql
select service_id, service_version, count(*) as row_count
from service_definition
group by service_id, service_version
having count(*) > 1;
```

Example invalid-key SQL:

```sql
select id, service_id, service_version
from service_definition
where service_id is null
   or trim(service_id) = ''
   or service_version is null
   or trim(service_version) = '';
```

The framework does not auto-delete old duplicates because production cleanup rules depend on your retention and audit requirements.

## Diagnostics endpoint

The hosted registry now exposes:

- `GET /serviceregistry/diagnostics`

The diagnostics payload reports:

- total registered services
- duplicate `serviceId + serviceVersion` groups
- groups where the same version was published with changed metadata
- duplicate operation links
- duplicate parameter links
- invalid rows with missing service keys

This endpoint is the safest first step before applying the DB uniqueness constraint in production.

## Why response metadata matters

Remote Chenile calls return `GenericResponse<T>`, but remote clients often need to reconstruct `T`, including parameterized types like `List<Foo>`.

The registry stores that output metadata in `ChenileRemoteOperationDefinition`, including:

- plain output class name
- parameterized output type string when relevant

That metadata is then used by the proxy layer to deserialize remote responses correctly.

## Hosting the registry

A server that hosts the registry includes:

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>service-registry-service</artifactId>
</dependency>
```

and scans:

- `org.chenile.service.registry.configuration`

This makes the registry itself available as a Chenile service within that application.

If you are hosting the central registry in production, treat `serviceregistryService` as stateful operational infrastructure:

- back it with a real database rather than transient storage
- monitor `GET /serviceregistry/diagnostics`
- require version bumps for any remotely visible contract change
- keep cleanup SQL and uniqueness migration steps under change control

## Reading from the registry

A client that only needs to consume registry metadata includes:

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>service-registry-delegate</artifactId>
</dependency>
```

That gives it `ServiceRegistryClientImpl` plus the shared API model and cache.

## Relationship to `chenile-proxies`

The service registry does not perform remote service invocation by itself.

It provides the metadata that `chenile-proxies` consumes.

The usual layering is:

1. `service-registry-service` hosts the registry
2. `service-registry-delegate` fetches remote service definitions
3. `chenile-proxy` uses those definitions to build interface-based remote calls

If you want the invocation side as well, read the companion guide:

- `Chenile Service Registry And Proxies Guide`

## When to use the registry directly

Use the registry directly when:

- you are building infrastructure around remote Chenile service discovery
- you need to inspect service metadata
- you are debugging why a proxy cannot resolve a service or operation
- you want latest-version or exact-version service lookup behavior

Use `chenile-proxies` on top of it when your goal is actual service invocation.
