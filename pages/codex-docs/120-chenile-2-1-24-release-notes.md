---
title: Chenile 2.1.24 Release Notes
keywords: chenile 2.1.24 release notes service registry admin ui diagnostics database migration
tags: [chenile release notes service-registry admin-ui database]
sidebar: codex_sidebar
permalink: /codex-chenile-2-1-24-release-notes.html
folder: codex-docs
summary: Release notes for Chenile 2.1.24 covering service registry idempotency hardening, registry diagnostics, database uniqueness changes, and the packaged chenile-admin-ui module.
---

Chenile `2.1.24` hardens the hosted service registry for production restarts and redeployments, and ships `chenile-admin-ui` as a consumable Maven module that can be mounted at `/chenile/admin`.

## Highlights

### Security auth framework and sample

- `chenile-security` now contains a separated `auth-framework` directory for the new auth server, gateway, starters, and shared auth contracts.
- Existing Chenile security modules remain isolated under `legacy-security` so current users can continue with the existing framework.
- `chenile-samples` now includes `security-auth-sample`, a developer reference application with an auth implementation module, auth server, gateway app, two protected services, React UI, Docker runtime, and Postgres-backed seed data.
- Framework properties use the `chenile.security.*` namespace; sample-only properties use `sample.security.*`.

### Service registry duplicate-write hardening

- `service-registry-service` now treats `(serviceId, serviceVersion)` as an immutable registration key.
- Registry startup republishing, service restarts, and concurrent deployments no longer create a new row for the same logical service version.
- If the same service definition is published again, the existing canonical row is reused.
- If a changed definition is published without a version bump, the registry logs a warning and keeps the existing canonical row instead of inserting a duplicate.

### Cache and delegate robustness

- `ServiceRegistryCache` now uses semantic fingerprinting rather than fragile object equality for duplicate detection.
- Cache storage now ignores null or invalid definitions instead of polluting the in-memory registry view.
- Latest-version selection is now numeric-aware, so versions like `2.1.10` sort after `2.1.9`.
- `service-registry-delegate` now tolerates failed remote writes more safely and avoids caching null write responses.

### Registry diagnostics

- `service-registry-service` now exposes `GET /serviceregistry/diagnostics`.
- Diagnostics report:
  - duplicate `serviceId + serviceVersion` groups
  - duplicate operation links
  - duplicate parameter links
  - changed definitions published under the same version
  - invalid rows with blank `serviceId` or `serviceVersion`
- This endpoint is intended for both operational inspection and pre-migration cleanup.

### Chenile Admin UI packaging

- `chenile-core` now publishes `org.chenile:chenile-admin-ui`.
- The module packages the built frontend inside the jar and serves it from `/chenile/admin`.
- The admin UI now surfaces service-registry diagnostics and makes duplicate or changed-same-version issues visible without manual SQL inspection.

## Database changes

This release adds stronger database-level guarantees for the hosted service registry model.

### Schema expectations

`service_definition` now requires:

- `service_id` to be non-null
- `service_version` to be non-null
- a unique constraint on `(service_id, service_version)`

Constraint name used by the JPA model:

- `uk_service_definition_service_version`

### Upgrade impact

Do not apply the uniqueness constraint blindly on an existing production registry database.

First clean up:

- duplicate rows for the same `service_id` and `service_version`
- rows where either `service_id` or `service_version` is blank or null
- duplicate operation or parameter link rows if your database accumulated them

Recommended upgrade sequence:

1. Deploy the application code with diagnostics available.
2. Inspect `GET /serviceregistry/diagnostics`.
3. Clean duplicate and invalid rows in the database.
4. Apply the non-null and uniqueness constraints.
5. Restart the registry host and verify diagnostics are clean.

### Example duplicate discovery SQL

Use discovery SQL like this before adding the unique key:

```sql
select service_id, service_version, count(*) as row_count
from service_definition
group by service_id, service_version
having count(*) > 1;
```

And invalid-key discovery:

```sql
select id, service_id, service_version
from service_definition
where service_id is null
   or trim(service_id) = ''
   or service_version is null
   or trim(service_version) = '';
```

Cleanup SQL is intentionally not prescribed here because the correct deletion strategy depends on your production data retention rules and foreign-key shape.

## Upgrade notes

- Consumers hosting the central registry should plan a DB cleanup window before enforcing the unique key.
- Producers must bump `serviceVersion` when the remotely visible contract changes.
- Consumers that want the packaged admin UI can now add `org.chenile:chenile-admin-ui` and expose `/chenile/admin` from the same Spring MVC application.

## Documentation updates

The Chenile docs were updated to reflect:

- the `2.1.24` release note page
- service registry diagnostics and production-hardening behavior
- the database migration expectations for `service_definition`
- the packaged `chenile-admin-ui` Maven module and `/chenile/admin` path
- the new security auth sample and Chenile auth/gateway framework integration pattern

---
keywords: chenile 2.1.24 release notes release alignment documentation
tags: [chenile release notes documentation versioning]
sidebar: codex_sidebar
permalink: /codex-chenile-2-1-24-release-notes.html
folder: codex-docs
summary: Release notes for Chenile 2.1.24 covering release alignment, documentation refresh, and application parent upgrades.
---

Chenile `2.1.24` is the current published framework baseline for this workspace and documentation set.

## Highlights

### Release alignment

- The standard 11 Chenile repositories are aligned on `2.1.24`.
- `chenile-gen` now defaults generated projects to `2.1.24`.
- Application repositories that inherit directly from `chenile-parent` should also move to `2.1.24`.
- `chenile-javadoc` is aligned to the same parent release.

### Documentation refresh

The documentation set was updated to reflect:

- the `2.1.24` release baseline
- the refreshed sidebar versions across the docs site
- the current release baseline in the architecture and modules overview pages
- the current `chenile-gen` example dependency version

## Upgrade notes

- Applications that inherit from `org.chenile:chenile-parent` should use `2.1.24`.
- Generated or copied dependency examples should now prefer `2.1.24`.
- Older release notes remain available for historical context, but the active documentation baseline is now `2.1.24`.
