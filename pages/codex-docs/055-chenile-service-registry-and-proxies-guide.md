---
title: Chenile Service Registry And Proxies Guide
keywords: chenile service registry proxies proxybuilder proxyutils restclient
tags: [chenile service-registry proxies]
sidebar: codex_sidebar
permalink: /codex-chenile-service-registry-and-proxies-guide.html
folder: codex-docs
summary: How chenile-service-registry and chenile-proxies work together, and how to replace direct RestClient usage with Chenile interface-based proxies.
---

This guide documents how `chenile-service-registry` and `chenile-proxies` work together, and how to replace direct `RestClient` usage with a Chenile proxy.

## Why these two repositories matter together

`chenile-service-registry` answers:

- what remote Chenile services exist
- what operations they expose
- what URLs and return types they advertise

`chenile-proxies` answers:

- how a caller invokes one of those services through a Java interface
- whether the call should be routed locally or remotely
- how request and response conversion should happen

Together, they let an application depend on a service interface instead of hand-writing HTTP client code.

## Module roles

### `chenile-service-registry`

Modules:

- `service-registry-api`
- `service-registry-service`
- `service-registry-delegate`

Responsibilities:

- `service-registry-api`
  contains `ChenileRemoteServiceDefinition`, `ChenileRemoteOperationDefinition`, `ServiceRegistryService`, and the local near-cache.
- `service-registry-service`
  hosts the registry, persists definitions, and publishes local Chenile services into the registry at startup.
- `service-registry-delegate`
  is the client-side delegate that talks to a remote registry endpoint and maintains a local cache of remote definitions.

### `chenile-proxies`

Modules:

- `chenile-proxy`

Responsibilities:

- `ProxyBuilder`
  creates a Java proxy for a Chenile service interface.
- `ProxyUtils`
  looks up remote service definitions and operation definitions from the registry.
- `RemoteProxyInvoker`
  performs the actual remote invocation.
- `ResponseBodyTypeSelector`
  reconstructs the correct `GenericResponse<T>` type for remote calls using service-registry metadata.

## End-to-end flow

### Server side

1. The server hosts `service-registry-service`.
2. On startup, `ServiceRegistryInitializer` walks the local Chenile configuration and saves each service definition.
3. Those definitions include:
   - service id
   - version
   - base URL
   - operation URLs
   - output type metadata

### Client side

1. The client includes `service-registry-delegate`.
2. `RemoteServiceRegistryInitializer` can publish local client services to a remote registry if needed.
3. `ServiceRegistryClientImpl` reads remote definitions from the server-side registry and caches them locally.
4. `ProxyBuilder` uses those definitions to create an interface-based proxy.
5. Business code calls the Java interface, not HTTP.

## Configuration needed

### Server package

The server must include the hosted registry service:

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>service-registry-service</artifactId>
</dependency>
```

And the Spring application must scan:

- `org.chenile.service.registry.configuration`

### Client package

The client must include:

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>service-registry-delegate</artifactId>
</dependency>
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>chenile-proxy</artifactId>
</dependency>
```

The client must also know where the remote registry is hosted:

```yaml
chenile:
  remote:
    service:
      registry: http://localhost:8000
```

## Replacing `RestClient` with Chenile proxy

## Before

The direct HTTP approach hard-codes URL structure and response parsing in application code.

Example pattern:

```java
restClient.post()
    .uri("/case-history")
    .body(entry)
    .retrieve()
    .toBodilessEntity();
```

And:

```java
restClient.get()
    .uri("/case-history/{caseId}", caseId)
    .retrieve()
    .body(CASE_HISTORY_LIST_RESPONSE);
```

Problems with this style:

- URL knowledge is duplicated in the client
- response typing is manual
- transport details leak into business code
- moving a service between local and remote invocation requires client rewrites

## After

Define and depend on the service interface:

- `CaseHistoryService`

Create a proxy bean:

```java
@Bean
CaseHistoryService caseHistoryService(ProxyBuilder proxyBuilder) {
    return proxyBuilder.buildProxy(CaseHistoryService.class, "caseHistoryService", null);
}
```

Then business code becomes:

```java
caseHistoryService.save(entry);
List<CaseHistoryEntry> entries = caseHistoryService.retrieve(caseId);
```

This is exactly the pattern now used by:

- `AiModelConfiguration`
- `CaseMemoryService`

## What the proxy needs

For `ProxyBuilder` to work, the service must be present in the registry with a Chenile service id.

In the `casehistory` example:

- the interface is `CaseHistoryService`
- the Chenile controller is registered as service id `caseHistoryService`

Specifically:

```java
@ChenileController(value = "caseHistoryService", serviceName = "_caseHistoryService_")
```

The proxy bean must use the same service id:

```java
proxyBuilder.buildProxy(CaseHistoryService.class, "caseHistoryService", null)
```

## How response typing works

Remote Chenile calls return `GenericResponse<T>`.
The proxy layer reconstructs `T` from service-registry metadata.

That is handled in:

- `ChenileRemoteOperationDefinition`
- `ResponseBodyTypeSelector`

This is why the client can call:

```java
List<CaseHistoryEntry> entries = caseHistoryService.retrieve(caseId);
```

without hand-writing a `ParameterizedTypeReference`.

## When to keep `RestClient`

Use a Chenile proxy when:

- the target is a Chenile service
- the target is registered in the service registry
- you want interface-based invocation
- you want to hide transport details from business code

Use `RestClient` when:

- the remote system is not a Chenile service
- you need a one-off external API client
- the service contract is not represented as a shared Java interface

## Migration checklist

1. Move the target contract into a shared API module.
2. Host the target service through a normal Chenile controller and service id.
3. Include `service-registry-service` on the server.
4. Include `service-registry-delegate` and `chenile-proxy` on the client.
5. Point `chenile.remote.service.registry` to the server.
6. Create a proxy bean with `ProxyBuilder`.
7. Replace `RestClient` code with the shared interface.
8. Remove manual URL and response-type handling from business services.
