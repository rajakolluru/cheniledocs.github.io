---
title: Chenile Core Developer Guide
keywords: chenile core developer framework modules
tags: [developer chenile core]
sidebar: developer
permalink: /developer-chenile-core.html
summary: Deep technical guide for developers using and contributing to chenile-core
---

## What Is Chenile Core

`chenile-core` is the foundational runtime layer of the Chenile ecosystem.
It provides service orchestration, interceptor chaining, context propagation, type transformation, and HTTP integration primitives used by higher-level modules.

Repository path:

`/ajapro/chenile-core`

## Module Map And When To Use Each

From the parent POM, `chenile-core` contains these modules:

- `chenile-base`: Foundational contracts, response/error models.
- `owiz`: Chain/command orchestration engine used by interceptor flows.
- `chenile-core`: Core runtime bootstrapping, service/event initialization, interceptor interpolation, context handling.
- `chenile-http`: HTTP adapter, controller support, annotation-driven service registration.
- `stm`: State transition machine engine.
- `utils`: Generic utility components used by runtime and apps.
- `jpa-utils`: JPA helper patterns for Chenile services.
- `multi-datasource-utils`: Tenant-aware datasource routing.
- `cucumber-utils`: Integration testing and BDD utilities.

Typical combinations:

- Plain HTTP service: `chenile-core` + `chenile-http`.
- Stateful workflow service: add `stm`.
- Multi-tenant persistence: add `jpa-utils` + `multi-datasource-utils`.
- BDD-heavy service testing: add `cucumber-utils`.

## Module Deep Dive

### chenile-base {#chenile-base}

Contains common contracts used across modules, including base response and error model definitions.
Use this when you need shared framework abstractions without bringing in full HTTP/runtime integrations.

### owiz {#owiz}

Provides the chain/command orchestration engine used by Chenile runtime flows.
This powers composition patterns such as sequential execution, interception, and context-aware command pipelines.

### chenile-core module {#chenile-core-module}

Bootstraps Chenile runtime configuration, service/event initialization, context container wiring, and orchestrator setup.
If you are extending core processing behavior, this is the primary module to inspect.

### chenile-http {#chenile-http}

Adds HTTP endpoint integration through `@ChenileController`, `ControllerSupport`, URL mappings, and controller-to-operation initialization.
Use this for Spring MVC based service exposure.

### stm {#stm}

State Transition Machine support for stateful service flows and event-driven lifecycle transitions.
Use this when service behavior depends on explicit states and allowed transitions.

### utils {#utils}

General utility helpers shared by framework and service implementations.
Useful for cross-cutting helper functionality that is runtime-agnostic.

### jpa-utils {#jpa-utils}

Persistence helpers and patterns for JPA-backed Chenile services.
Use this with Spring Data JPA services to reduce repetitive persistence plumbing.

### multi-datasource-utils {#multi-datasource-utils}

Tenant-aware datasource routing support built around `ContextContainer.getTenant()`.
Use this for multi-tenant deployments requiring per-tenant datasource selection.
Detailed setup and usage: [Multi Datasource Utils Guide](/developer-chenile-core-multi-datasource-utils.html)

### cucumber-utils {#cucumber-utils}

Utilities for BDD and integration testing with Cucumber in Chenile services.
Use this in test modules for standard service-invocation test patterns.
Detailed setup and usage: [Cucumber Utils Guide](/developer-chenile-core-cucumber-utils.html)

### custom id generator {#custom-id-generator}

Chenile supports pluggable ID generation strategies used by `BaseJpaEntity`.
Detailed setup and usage: [Custom ID Generator Guide](/developer-chenile-core-custom-id-generator.html)

## Runtime Pipeline (Interceptor Highway)

The default execution flow is defined in:

`chenile-core/src/main/resources/org/chenile/core/chenile-core.xml`

Key stages in order:

1. Header validation/copy.
2. Pre-processor interpolation.
3. Body type selection.
4. Payload transformation.
5. Service reference resolution.
6. Post-processor interpolation.
7. Operation/service-specific interceptors.
8. Service invocation.
9. Exception and response handling.

This means cross-cutting behavior should usually be introduced as pre/post/operation/service interceptors, not inside each service method.

## Bootstrapping Properties (`chenile.properties`)

`ChenileCoreConfiguration` reads startup settings from `chenile.properties`.
A practical baseline (from sample configurations):

```properties
chenile.service.json.package=classpath*:org/chenile/samples/**/service/*.json,classpath*:org/chenile/**/service/*.json
chenile.event.json.package=classpath*:org/chenile/samples/**/event/*.json
chenile.interceptors.path=org/chenile/core/chenile-core.xml
chenile.module.name=m1
chenile.pre.processors=populateContextContainer
chenile.post.processors=
```

Important keys:

- `chenile.module.name`: Module identity in Chenile configuration.
- `chenile.service.json.package`: JSON service definition scan path.
- `chenile.event.json.package`: Event definition scan path.
- `chenile.interceptors.path`: Interceptor chain XML.
- `chenile.pre.processors` / `chenile.post.processors`: Global interceptor hooks.

## HTTP Integration Pattern (Annotation-Driven)

`chenile-http` provides `@ChenileController` + `ControllerSupport`.
At app startup, `AnnotationChenileServiceInitializer` scans controllers with `@ChenileController` and maps Spring route methods into Chenile operation definitions.

Example pattern:

```java
@RestController
@ChenileController(value = "s1Service", serviceName = "_s1Service_", healthCheckerName = "s1HealthChecker")
public class S1Controller extends ControllerSupport {

  @PostMapping("/s1/op1")
  public ResponseEntity<GenericResponse<S1Entity>> op1(HttpServletRequest request,
                                                        @RequestBody S1Entity entity) {
    return process("op1", request, entity);
  }
}
```

Notes:

- `process(...)` builds `ChenileExchange`, sets headers/body, and dispatches through `ChenileEntryPoint`.
- Returned HTTP status and warning headers are populated from exchange metadata.
- Controller method name can be used as operation name via `process(request, args...)`, or passed explicitly.

## Advanced Body-Type Mapping

When controller payload type differs from service method signature, use `@ChenileParamType`.
When body type depends on runtime input (for example path variable or event), use `@BodyTypeSelector`.

Pattern:

```java
@PostMapping("/add-capacity-generic/{type}")
@BodyTypeSelector({"roomVehicleBodyTypeSelector", "subclassBodyTypeSelector"})
public ResponseEntity<GenericResponse<Capacity>> addCapacityGeneric(
    HttpServletRequest request,
    @PathVariable("type") String type,
    @ChenileParamType(Object.class) @RequestBody String object) {
  return process(request, type, object);
}
```

## JSON Service Definition Model

You can define services through JSON files scanned by `chenile.service.json.package`.
A typical operation contains:

- `name`
- `url`
- `httpMethod`
- `params` with `BODY`, `HEADER`, or `HEADERS`
- optional `interceptorComponentNames`
- optional `bodyTypeSelectorComponentNames`

This model is useful when you want explicit contract metadata and/or non-annotation service bootstrapping.

## Context And Header Model

`ContextContainer` is a thread-local request context populated from incoming headers.
Frequently used header keys are centralized in `HeaderUtils`, including:

- `x-chenile-tenant-id`
- `x-chenile-uid`
- `x-correlation-id`
- `x-request-id`
- `x-chenile-trajectory-id`

Guidelines:

- Use `ContextContainer` for transport metadata (tenant/user/correlation), not business payload.
- Do not rely on it in reactive/non-thread-bound execution flows.
- Clear or isolate context for async/background execution boundaries.

## Specialized Guides

- [Multi Datasource Utils Guide](/developer-chenile-core-multi-datasource-utils.html)
- [Cucumber Utils Guide](/developer-chenile-core-cucumber-utils.html)
- [Custom ID Generator Guide](/developer-chenile-core-custom-id-generator.html)

## Build, Versioning, Release Basics

- Version source file: `chenile-core-version.txt`
- Current local value: `2.1.11`

Build locally:

```bash
cd /ajapro/chenile-core
make build
```

Equivalent Maven command:

```bash
mvn -Drevision=$(cat chenile-core-version.txt) install
```

Common Make targets:

- `make clean`
- `make javadoc`
- `make test-javadoc`
- `make prepare-deploy`
- `make deploy`

## Common Pitfalls

- `@ChenileController(serviceName=...)` not matching bean name of service implementation.
  Startup succeeds partially but runtime resolution fails for that service.
- Missing/incorrect `chenile.interceptors.path`.
  Requests may bypass expected processing chain.
- Incorrect scan paths for `chenile.service.json.package` / `chenile.event.json.package`.
  Services/events silently not initialized.
- Overusing context for domain data.
  Creates hard-to-test coupling and cross-request leakage risk.

## Recommended Dev Flow For Core Changes

1. Implement/change in relevant module (`chenile-core`, `chenile-http`, `stm`, etc.).
2. Run module build and tests.
3. Validate behavior in `chenile-samples` with a representative service.
4. Update docs in this Developer Docs section.

## Related Docs

- [Ajapro Framework Developer Guide](/developer-ajapro-framework-guide.html)
- [Developer Docs Start](/developer-start.html)
- [Chenile Overview](/index.html)
