---
title: Chenile Query and JDBC Query Catalog
description: Configure metadata-driven MyBatis queries, tenant routing, and the startup-loaded JDBC Query Catalog.
permalink: /developer/query-catalog/
---

# Chenile Query and JDBC Query Catalog

Chenile Query exposes a named, metadata-governed read API over MyBatis. A query has two independent parts:

| Part | Purpose | Example |
| --- | --- | --- |
| MyBatis statement | Defines the SQL and returned columns | `Student.getAll` |
| Query metadata | Defines the public query name, allowed filters, sorting, pagination, and ACLs | `students` |

The optional JDBC Query Catalog loads those parts from a deployment-managed database at application startup.
It is useful when operations teams need to promote approved query definitions without repackaging an application.
It does not provide a runtime editing API or hot reload.

## Request flow and tenant model

The optional `chenile-query-controller` exposes `POST /q/{queryName}`. It resolves the request tenant from
Chenile's `ContextContainer`, selects that tenant's query datasource, resolves the query metadata, and executes
its MyBatis statement. The usual HTTP integration places `x-chenile-tenant-id` into the context.

```text
POST /q/students + tenant header
  -> QueryTenantResolver
  -> tenant QueryMetadata, then base QueryMetadata
  -> tenant datasource
  -> MyBatis statement named by QueryMetadata.id
  -> SearchResponse
```

The tenant is required unless `query.defaultTenantId` is configured. A missing tenant without a default fails
the request; it never silently chooses an arbitrary datasource.

```yaml
query:
  defaultTenantId: tenant1
  datasources:
    tenant1:
      jdbcUrl: jdbc:postgresql://db.example/tenant1_query
      username: query_reader
      password: ${TENANT1_QUERY_PASSWORD}
    tenant2:
      jdbcUrl: jdbc:postgresql://db.example/tenant2_query
      username: query_reader
      password: ${TENANT2_QUERY_PASSWORD}
```

Datasource entries are passed to HikariCP. Configure the JDBC driver and pool properties appropriate to the
application's database. The configured tenant id must exist in `query.datasources`; routing does not fall back
from one tenant database to another.

## Classpath configuration

Classpath files remain the default and are the simplest option for a query shipped with the application.
Configure one or more comma-separated Spring resource patterns.

```yaml
query:
  mapperFiles: classpath*:org/example/query/mapper/*.xml
  definitionFiles: classpath*:org/example/query/mapper/*.json
  pagination:
    countQueryEnabled: true
```

Each mapper uses normal MyBatis XML. The mapper namespace and statement id form the metadata `id`.

```xml
<mapper namespace="Student">
  <select id="getAll" resultType="map">
    select id, name, branch, percentage from student
  </select>
</mapper>
```

Definition files contain a JSON array. `name` is the externally visible path name; `id` is the internal MyBatis
statement. Only declare columns that callers may filter or sort.

```json
[
  {
    "name": "students",
    "id": "Student.getAll",
    "paginated": true,
    "acls": ["QUERY_STUDENTS"],
    "columnMetadata": {
      "name": {
        "name": "name",
        "columnType": "Text",
        "filterable": true,
        "likeQuery": true,
        "sortable": true
      },
      "percentage": {
        "name": "percentage",
        "columnType": "Number",
        "filterable": true,
        "sortable": true
      }
    }
  }
]
```

`filterable`, `likeQuery`, `containsQuery`, `betweenQuery`, and `sortable` are allow-list controls, not UI hints.
The service uses them to reject unsupported request operations. A column can also set `columnName` when its SQL
name differs from the API field name. `countQueryEnabled` on a definition overrides the global pagination setting;
when counts are disabled, the service detects a next page by fetching one extra row.

## Tenant-specific query definitions

Keep a base definition for the common behavior. Add a second definition with the same `name` and a `tenantId`
only when that tenant needs a different statement or query behavior.

```json
[
  {
    "name": "students",
    "tenantId": "tenant1",
    "id": "tenant1.Student.getAll",
    "paginated": true,
    "columnMetadata": {
      "name": { "name": "name", "columnType": "Text", "filterable": true }
    }
  }
]
```

For tenant `tenant1`, this definition replaces the base definition named `students`. Every other tenant continues
to use the base definition. Statement names are global within the MyBatis factory, so tenant-specific SQL must use
a tenant-qualified mapper namespace such as `tenant1.Student`; do not try to load a separate mapper set per tenant.

## JDBC Query Catalog

Enable the catalog after the application supplies a dedicated, read-only `DataSource` bean. The catalog datasource
is for configuration only; it is separate from tenant query datasources.

```yaml
query:
  catalog:
    jdbc:
      enabled: true
      dataSource: queryCatalogDataSource
      baseScope: __base__
```

When enabled, `query.mapperFiles` and `query.definitionFiles` are optional. They may still be configured during a
migration: catalog rows override matching packaged configuration, while unrelated packaged entries remain available.
When the catalog is disabled, `query.definitionFiles` is required.

Apply the framework's `chenile-query-catalog-schema.sql` using Liquibase, Flyway, or the application's migration
tool. The runtime account needs only `SELECT`; use a separate reviewed migration or administration process for
updates.

### Catalog tables and scope

`chenile_query_mapper_source` contains global mapper XML. Its primary key is `namespace`, and the `namespace`
column must exactly match the root `<mapper namespace="…">` value. There is deliberately no tenant scope on this
table because one MyBatis `SqlSessionFactory` loads all mapper statements.

`chenile_query_definition_source` contains one JSON object per row, not an array. Its primary key is
`(scope_key, query_name)`:

| `scope_key` | Meaning |
| --- | --- |
| `__base__` (or configured `baseScope`) | Base definition for every tenant |
| exact tenant id, for example `tenant1` | Override for that tenant only |

The `query_name` column must match JSON `name`. The JSON `tenantId`, if supplied, must match the tenant scope;
the catalog sets it from `scope_key`. `enabled=false` makes a row unavailable at the next restart.

An illustrative catalog definition row is:

```sql
insert into chenile_query_definition_source
    (scope_key, query_name, definition_json, checksum)
values
    ('tenant1', 'students',
     '{"name":"students","id":"tenant1.Student.getAll","paginated":true}',
     'sha256-of-approved-definition');
```

### Merge and validation rules

- A database mapper replaces a classpath mapper only when they have the same namespace.
- A database definition replaces a classpath definition only when both have the same external name in the same
  base or tenant scope.
- All enabled database mapper namespaces must be unique, and their XML must be valid.
- Every database definition must reference a statement that exists after classpath and catalog mapper loading.
- Invalid XML or JSON, mismatched names/scopes, unavailable catalog datasource, or an unresolved statement fails
  application startup. This prevents a partially configured query service from serving traffic.

Catalog data is read once during startup. Change it through versioned SQL or a controlled administration process,
then restart or roll out a new application instance. There is no polling, scheduler, write endpoint, or hot reload.

## Request example and operational checks

```http
POST /q/students
x-chenile-tenant-id: tenant1
Content-Type: application/json

{
  "pageNum": 1,
  "numRowsInPage": 25,
  "filters": { "name": "Ada" },
  "sortCriteria": [{ "name": "name", "ascendingOrder": true }]
}
```

The exact request shape is `SearchRequest`; it also supports `systemFilters`, selected `fields`, hidden columns,
`customVariables`, `countOnly`, and canned-report options. Treat `customVariables` as trusted application inputs:
they are not a substitute for declaring user-filterable metadata.

Before release, verify the following for each changed query:

1. The tenant header selects the intended datasource and the intended base or tenant definition.
2. The metadata statement id exists and produces the columns named by the metadata.
3. Allowed filters and sorts work; unsupported fields are rejected.
4. Pagination behavior matches the configured count-query policy.
5. A catalog rollout starts cleanly with the production read-only account and rejects intentionally invalid data in
   a non-production environment.

For a non-MyBatis backend, register a `QueryExecutionProvider` bean and set `query.provider` to that provider's
name. Query metadata, tenant resolution, and the controller contract remain the same.
