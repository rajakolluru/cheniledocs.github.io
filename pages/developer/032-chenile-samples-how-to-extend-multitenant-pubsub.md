---
title: How To Extend Chenile Service (Multi-Tenant PubSub)
keywords: chenile samples multitenant pubsub extension guide
tags: [developer chenile samples multitenant]
sidebar: developer
permalink: /developer-chenile-samples-how-to-extend-multitenant-pubsub.html
summary: Developer how-to for extending vehicle core for tenant0 and tenant1 in one JVM
---

## Purpose

This module is a technical sample for **TDD-first multi-tenant extension** of a Chenile workflow service.

It shows how to:

- keep reusable core module (`vehicle`)
- add independent tenant extension modules (`custom-tenant0`, `custom-tenant1`)
- package both in one runtime (`packager`) with multi-datasource routing
- verify behavior through cucumber tests

Module path:

`/ajapro/chenile-samples/how_to_extend_chenile_service_multitenant_pubsub`

GitHub source:

- https://github.com/ajapros/chenile-samples/tree/main/how_to_extend_chenile_service_multitenant_pubsub

## 1. Module Layout

Root modules:

- `vehicle`
  - `vehicle/api`: core model contracts
  - `vehicle/service`: core workflow + REST + central HTTP subtype registration
- `custom-tenant0`
  - `api`: tenant0 extension entity (`tenant0_ext`)
  - `service`: tenant0-specific `ext` transition action and tests
- `custom-tenant1`
  - `api`: tenant1 extension entity (`tenant1_ext`)
  - `service`: tenant1-specific `ext` transition action and tests
- `packager`
  - `service`: imports both tenant modules and validates both workflows in one JVM

## 2. Core Design

Subtype registration is centralized in:

- `vehicle/service/src/main/java/com/mycompany/myorg/vehicle/configuration/VehicleConfiguration.java`

`VehicleConfiguration` implements `WebMvcConfigurer` and registers extension subtypes dynamically from:

- `chenile.http.extension-subtypes`

This keeps tenant modules independent: they contribute YAML config values, not core wiring changes.

## 2.1 Tenant-Aware Action Discovery

Base workflow config wires transition action discovery with tenant awareness:

```java
@Bean
STMTransitionActionResolver vehicleTransitionActionResolver(
@Qualifier("defaultvehicleSTMTransitionAction") STMTransitionAction<Vehicle> defaultSTMTransitionAction){
    return new STMTransitionActionResolver("vehicle",defaultSTMTransitionAction, HeaderUtils.TENANT_ID_KEY.replace("x-",""));
}
```

What this does:

- prefix `vehicle` enables standard transition action discovery
- tenant key derives from request header `x-chenile-tenant-id`
- same workflow event (`ext`) resolves tenant-specific beans

In this sample, extension beans are:

- tenant0: `@Bean("tenant0VehicleExt")`
- tenant1: `@Bean("tenant1VehicleExt")`

## 2.2 Initial vs Extended Workflow

Core workflow (`vehicle`):

- `OPENED -> ASSIGNED` (`assign`)
- `ASSIGNED -> RESOLVED` (`resolve`)
- `ASSIGNED -> CLOSED` (`close`)

Tenant extension workflow adds:

- `ASSIGNED -> EXTENSION` (`ext`)
- `EXTENSION -> CLOSED` (`close`)

This enables shared base lifecycle with tenant-specific extension behavior.

## 2.3 Required Extension Subtype YAML

```yaml
chenile:
  http:
    extension-subtypes:
      - name: tenant0_ext
        className: com.mycompany.myorg.vehicle.model.VehicleExtensionTenant0
      - name: tenant1_ext
        className: com.mycompany.myorg.vehicle.model.VehicleExtensionTenant1
```

## 3. Tenant Modules

### Tenant0

- Entity type: `tenant0_ext`
- Config class:
  - `custom-tenant0/service/src/main/java/com/mycompany/myorg/vehicle/extension/configuration/VehicleExtentionConfiguration.java`
- Action class:
  - `custom-tenant0/service/src/main/java/com/mycompany/myorg/vehicle/extension/service/cmd/Tenant0ExtVehicleAction.java`

`ext` behavior:

- sets `newColumn`
- sets `tenant0WorkflowNote`
- publishes event to `vehicle.events.test` with tenant header propagation

### Tenant1

- Entity type: `tenant1_ext`
- Config class:
  - `custom-tenant1/service/src/main/java/com/mycompany/myorg/vehicle/extension/configuration/Tenant1VehicleConfiguration.java`
- Action class:
  - `custom-tenant1/service/src/main/java/com/mycompany/myorg/vehicle/extension/service/cmd/Tenant1ExtVehicleAction.java`

`ext` behavior:

- sets `tenant1WorkflowNote`
- publishes event to `vehicle.events.test` with tenant header propagation

## 4. Packager (Both Tenants In One JVM)

Packager test runtime:

- `packager/service/src/test/java/com/mycompany/myorg/vehicle/packager/PackagerSpringTestConfig.java`
- imports `MultiTenantDataSourceConfiguration`
- scans `org.chenile` and `com.mycompany`

Packager config:

- `packager/service/src/test/resources/application.yml`
- defines tenant datasources under `chenile.multids.datasources`
- defines both subtype registrations under `chenile.http.extension-subtypes`

Tenant context is header-driven:

- `x-chenile-tenant-id`

## 4.1 Runtime Configuration (Packager Test Baseline)

The packager integration test runtime uses these key blocks:

```yaml
chenile:
  http:
    extension-subtypes:
      - name: tenant0_ext
        className: com.mycompany.myorg.vehicle.model.VehicleExtensionTenant0
      - name: tenant1_ext
        className: com.mycompany.myorg.vehicle.model.VehicleExtensionTenant1
  multids:
    defaultTenantId: tenant1
    datasources:
      tenant1:
        jdbcUrl: jdbc:h2:mem:packager-tenant1;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
      tenant2:
        jdbcUrl: jdbc:h2:mem:packager-tenant2;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
```

Why this matters:

- `extension-subtypes` maps JSON `ext_type` to concrete Java subtype.
- `multids` routes persistence per tenant in a single JVM runtime.
- `defaultTenantId` defines fallback datasource when tenant is missing/invalid.

Reference:

- [Multi Datasource Utils Guide](/developer-chenile-core-multi-datasource-utils.html)

## 5. TDD Flow (Read Tests First)

Tenant0 specs:

- `custom-tenant0/service/src/test/resources/features/service.feature`

Tenant1 specs:

- `custom-tenant1/service/src/test/resources/features/service.feature`

Combined packager specs:

- `packager/service/src/test/resources/features/multitenant-service.feature`

Coverage includes:

- create + assign + ext + close
- tenant-specific extension column assertions
- pub/sub assertions with tenant propagation
- both tenants validated in same JVM runtime

## 5.1 Request/Execution Flow In This Sample

1. Request carries `x-chenile-tenant-id`.
2. Tenant header populates Chenile context.
3. Multi datasource router resolves tenant datasource.
4. Request body `ext_type` selects extension subtype (`tenant0_ext`/`tenant1_ext`).
5. `ext` transition resolves tenant-specific action bean.
6. Action mutates tenant-specific fields and emits pub/sub event.
7. Cucumber assertions verify both DB and event outcomes.

## 6. Pattern To Add New Tenant Extension

1. Add tenant entity in new tenant `api` module with new `ext_type`.
2. Add tenant-specific transition action in tenant `service` module.
3. Add tenant bean configuration class.
4. Add subtype mapping under `chenile.http.extension-subtypes`.
5. Add cucumber scenarios first (TDD).
6. Run tenant tests.
7. Extend packager tests for multi-tenant same-JVM validation.

## 7. Commands

Run tenant0 tests:

```bash
mvn -pl custom-tenant0/service -am test
```

Run tenant1 tests:

```bash
mvn -pl custom-tenant1/service -am test
```

Run packager multi-tenant tests:

```bash
mvn -pl packager/service -am test
```

Run only packager cucumber suite:

```bash
mvn -pl packager/service -am -Dtest=com.mycompany.myorg.vehicle.packager.bdd.CukesRestTest -Dsurefire.failIfNoSpecifiedTests=false test
```

## 8. Technical Rules

- Core module owns mapper wiring (`VehicleConfiguration`).
- Tenant modules stay independent for extension logic.
- Packager is integration point for loading all tenant modules.
- Routing is header-driven (`x-chenile-tenant-id`).
- Tests are source of truth (TDD-first).

## 9. Current Limitation

When both tenant modules run in same JVM (`packager`), extension workflow definitions must currently be identical in structure.

Practical meaning:

- tenant-specific Java actions can differ
- workflow XML extension shape must remain same across tenants in this setup

This is a known current limitation and expected to improve in future.

## Read More

- [Chenile Samples Developer Guide](/developer-chenile-samples.html)
- [Chenile Core Developer Guide](/developer-chenile-core.html)
- [Chenile Messaging Developer Guide](/developer-chenile-mqtt.html)
- [Multi Datasource Utils Guide](/developer-chenile-core-multi-datasource-utils.html)

## Source

This guide follows:

- `how_to_extend_chenile_service_multitenant_pubsub/README.md`
- https://github.com/ajapros/chenile-samples/tree/main/how_to_extend_chenile_service_multitenant_pubsub
