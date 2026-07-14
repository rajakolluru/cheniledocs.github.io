---
title: Query Framework Migration Guide
keywords: chenile query migration mybatis pagination provider
sidebar: chenile_sidebar
toc: true
permalink: /query-framework-migration-guide.html
folder: chenile
summary: Migrating existing Chenile Query applications to the newer provider and pagination model
---

# Query Framework Migration Guide

This guide is for applications already using the Chenile query framework with MyBatis mapper XML files and query definition JSON files.

## Migration Summary

For existing MyBatis/JDBC applications, migration is intentionally backward compatible.

Most applications do not need to change their existing query XML, query JSON, controller usage, request payloads, datasource configuration, or count queries.

The default behavior remains:

- Query execution uses MyBatis.
- Paginated queries execute `<queryId>-count`.
- Responses include exact `maxRows` and `maxPages`.
- Existing `query.datasources`, `query.mapperFiles`, `query.definitionFiles`, and `query.defaultTenantId` properties continue to work.

## Existing MyBatis Applications

Keep the existing configuration shape:

```yaml
query:
  defaultTenantId: tenant1
  mapperFiles: classpath*:query/mapper/*.xml
  definitionFiles: classpath*:query/mapper/*.json
  datasources:
    tenant1:
      type: com.zaxxer.hikari.HikariDataSource
      jdbcUrl: jdbc:h2:mem:demo_tenant1
      username: demo
      password: password
```

Do not set `query.provider` for normal MyBatis/JDBC usage. The framework defaults it to:

```yaml
query:
  provider: mybatis
```

You also do not need to set `query.mybatis.enabled`. It defaults to `true`.

## Multi-Tenant Query Migration

Existing query definitions continue to work as base definitions. No change is required if all tenants use the same query metadata and mapper SQL.

If one tenant/client needs a different query, add another query definition with the same external `name` and a `tenantId`:

```json
[
  {
    "id": "Student.getAll",
    "name": "students",
    "paginated": true
  },
  {
    "tenantId": "tenant1",
    "id": "tenant1.Student.getAll",
    "name": "students",
    "paginated": true
  }
]
```

The public URL remains `/q/students`. The framework resolves the active tenant from `x-chenile-tenant-id`, tries the tenant-specific definition first, and falls back to the base definition when no tenant override exists.

Tenant overrides are full metadata replacements. They do not merge with the base definition. Copy all required `columnMetadata`, ACLs, pagination flags, workflow fields, dropdown query metadata, and count settings into the tenant definition.

For MyBatis, add a mapper namespace matching the tenant id prefix:

```xml
<mapper namespace="tenant1.Student">
  <select id="getAll-count" resultType="int">...</select>
  <select id="getAll" resultType="map">...</select>
</mapper>
```

Do not expose tenant-prefixed query names to clients. The query name in the URL should remain stable across tenants.

Tenant routing is intentionally strict:

- missing or blank tenant uses `query.defaultTenantId` only when it is configured
- missing or blank tenant without a default fails with `Q723`
- unknown tenant does not fall back to the default tenant
- an invalid `query.defaultTenantId` fails at startup/configuration time

## Count Query Behavior

Old behavior remains the default. If a query is marked as paginated, the framework runs:

```text
<queryId>-count
```

and then runs the main query with pagination.

Example:

```json
{
  "id": "Student.getAll",
  "name": "students",
  "paginated": true
}
```

The framework expects this mapper id to exist:

```text
Student.getAll-count
```

No migration is required if this behavior is acceptable.

## Optional No-Count Mode

For high-volume list APIs where the count query is expensive, disable count query execution globally:

```yaml
query:
  pagination:
    countQueryEnabled: false
```

When disabled, the framework fetches `pageSize + 1` rows, trims the extra row, and uses that extra row to determine whether a next page exists.

Response behavior changes in no-count mode:

```json
{
  "maxRows": 0,
  "maxPages": 0,
  "pagination": {
    "countQueryExecuted": false,
    "totalCountAvailable": false,
    "nextPageAvailable": true
  }
}
```

Use `pagination.nextPageAvailable` instead of `maxPages` when count query is disabled.

## Request-Level Count Only

Clients can request only the total count by setting `countOnly` to `true` in `SearchRequest`:

```json
{
  "countOnly": true,
  "filters": {
    "branch": ["Bangalore"]
  },
  "pageNum": 1,
  "numRowsInPage": 25
}
```

For a paginated query, the framework executes only:

```text
<queryId>-count
```

The main list query is bypassed. The response returns an empty `list`, `numRowsReturned=0`, and exact `maxRows` / `maxPages`.

`countOnly=true` is a request-level override. It forces the count query even when the query definition or global `query.pagination.countQueryEnabled` disables normal count execution.

## Query-Level Count Override

The global `query.pagination.countQueryEnabled` flag can be overridden by an individual query definition. Add `countQueryEnabled` to the query JSON:

```json
{
  "id": "Student.getAll",
  "name": "students",
  "paginated": true,
  "countQueryEnabled": false
}
```

Precedence:

| Query metadata value | Behavior |
| --- | --- |
| `true` | Run `<queryId>-count` even if the global flag is disabled |
| `false` | Use no-count pagination even if the global flag is enabled |
| absent / `null` | Follow `query.pagination.countQueryEnabled` |

Truth table:

| Query JSON `countQueryEnabled` | Global `query.pagination.countQueryEnabled` | Effective behavior |
| --- | --- | --- |
| `true` | `true` | Count query runs |
| `true` | `false` | Count query runs |
| `true` | absent | Count query runs |
| `false` | `true` | Count query does not run |
| `false` | `false` | Count query does not run |
| `false` | absent | Count query does not run |
| absent | `true` | Count query runs |
| absent | `false` | Count query does not run |
| absent | absent | Count query runs |

Priority order:

1. Request `countOnly=true`
2. Query JSON `countQueryEnabled`, if present
3. Global `query.pagination.countQueryEnabled`, if present
4. Framework default `true`

This is useful when most queries should use one strategy, but a few high-volume queries need no-count pagination or a few important queries still need exact totals.

## Response Contract Change

`SearchResponse` now has an additional nullable field:

```java
private SearchPaginationInfo pagination;
```

Existing clients can ignore this field. It is mainly useful when `query.pagination.countQueryEnabled=false`.

When count query is enabled, `pagination` can remain `null` and existing `maxRows` / `maxPages` behavior is preserved.

## Count Result Type

The count query result can now be any `Number`, not only `Integer`.

This makes existing count mappers more tolerant of JDBC drivers that return `Long` for `count(*)`.

No mapper change is required unless your count query returns a non-numeric value.

## Provider Extension Migration

The old query framework was tightly coupled to MyBatis execution. The new framework keeps MyBatis as the default but allows applications to provide their own execution provider.

For existing MyBatis/JDBC services, do nothing:

```yaml
query:
  provider: mybatis
```

or omit `query.provider` completely.

For a custom backend, register a Spring bean that implements:

```java
org.chenile.query.service.impl.QueryExecutionProvider
```

Then select it:

```yaml
query:
  provider: document
```

For a provider that does not use MyBatis at all, disable MyBatis infrastructure:

```yaml
query:
  provider: document
  mybatis:
    enabled: false
  definitionFiles: classpath*:query/definitions/*.json
```

The query definition JSON is still used for:

- query lookup by external query name
- filter enrichment
- pagination flag
- column metadata
- ACL metadata
- response metadata

The custom provider owns only backend execution, sorting, pagination, and count behavior.

See [Query Provider Extension](/query-provider-extension.html) for complete provider examples.

## Suggested Migration Steps

1. Upgrade the query framework dependency.
2. Keep existing MyBatis mapper XML and query definition JSON unchanged.
3. Keep existing datasource YAML unchanged.
4. Run existing query Cucumber/API tests.
5. Add one test for default pagination to confirm `maxRows` and `maxPages` still match old behavior.
6. If count queries are expensive, add a separate profile with `query.pagination.countQueryEnabled=false`.
7. In no-count mode, update API clients to use `pagination.nextPageAvailable`.
8. Only create a custom `QueryExecutionProvider` if the backend cannot be handled by MyBatis/JDBC configuration.

## Quick Compatibility Checklist

- Existing `/q/{queryName}` REST endpoint: compatible.
- Existing `SearchRequest`: compatible.
- Existing `SearchResponse`: compatible; one nullable field was added.
- Existing MyBatis mapper XML: compatible.
- Existing query definition JSON: compatible.
- Existing count query mapper ids: compatible.
- Existing datasource YAML: compatible.
- Existing multi-tenant routing: compatible.
- New provider extension: optional.
- New no-count pagination mode: optional.
