---
title: Chenile Core Multi Datasource Utils
keywords: chenile core multi datasource utils tenant routing
tags: [developer chenile core]
sidebar: developer
permalink: /developer-chenile-core-multi-datasource-utils.html
summary: How to use multi-datasource-utils for tenant based datasource routing
---

## Purpose

`multi-datasource-utils` gives tenant-aware datasource routing for JPA workloads.
It registers a primary routing `DataSource` that selects datasource from `ContextContainer.getTenant()`.

## When To Use

Use this module when:

- You run one service for multiple tenants.
- Each tenant maps to a separate datasource.
- Tenant identity is passed in request headers (`x-chenile-tenant-id`).

## Add Dependency

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>multi-datasource-utils</artifactId>
</dependency>
```

## Configuration

Define tenant datasources under `chenile.multids`.

```yaml
chenile:
  multids:
    defaultTenantId: tenant1
    datasources:
      tenant1:
        jdbcUrl: jdbc:h2:mem:tenant1;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
        username: sa
        password: ''
        maximumPoolSize: '5'
      tenant2:
        jdbcUrl: jdbc:h2:mem:tenant2;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
        username: sa
        password: ''
        maximumPoolSize: '5'
```

## How Routing Works

- If tenant is present in `ContextContainer`, that tenant datasource is selected.
- If tenant is missing or unknown, default datasource is used.
- If no default is configured, first datasource in config is used as fallback.

## Request Header Contract

Pass tenant via header:

- `x-chenile-tenant-id: tenant1`

To populate context from HTTP headers, keep Chenile preprocessor setup enabled (common setup uses `populateContextContainer`).

## Minimal End-To-End Flow

1. Configure tenant datasources in `application.yml`.
2. Ensure controller requests flow through Chenile entrypoint (`ControllerSupport`).
3. Send `x-chenile-tenant-id` in incoming requests.
4. Execute repository call as usual; routing happens transparently.

## Example Controller Pattern

```java
@RestController
@ChenileController(value = "tenantItemService", serviceName = "tenantItemService")
public class TenantItemController extends ControllerSupport {

  @GetMapping("/test/items")
  public ResponseEntity<GenericResponse<Map<String, Object>>> items(HttpServletRequest request) {
    return process(request);
  }
}
```

## Verification Pattern

BDD tests in this module verify:

- no tenant header => default tenant data
- `tenant1` header => tenant1 data
- `tenant2` header => tenant2 data
- unknown tenant => fallback to default tenant

Use this as baseline behavior for your app tests.

## Common Pitfalls

- Missing `x-chenile-tenant-id` in upstream gateway/service chain.
- Not configuring `defaultTenantId` while expecting fallback.
- Skipping Chenile context population in pre-processors.
- Typo in tenant keys between headers and datasource map.

## Related Docs

- [Chenile Core Developer Guide](/developer-chenile-core.html)
- [Custom ID Generator Guide](/developer-chenile-core-custom-id-generator.html)
