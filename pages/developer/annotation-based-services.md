---
title: Annotation-based Chenile services
description: Define a Chenile service with annotations on a plain bean — no Spring REST controller required — and choose whether it registers into the service registry.
permalink: /concepts/annotation-based-services/
---

<p style="margin-bottom:1.4em"><a href="{{ '/concepts/02-definition-vs-implementation/' | relative_url }}">← Concept 2 · Definition vs. implementation</a></p>

# Annotation-based Chenile services

Two recent changes make defining a Chenile service lighter and more flexible:

1. **The Spring REST controller is decoupled from the service definition.** You can now turn a plain Spring bean into a full Chenile service with annotations alone — no `@RestController`, no `ControllerSupport`, no hand-written `@PostMapping` methods.
2. **Registering the service into the service registry is optional** — a single flag on the annotation.

Both are driven by the `@ChenileController` annotation and are handled entirely at startup by Chenile's service initializers.

## 1 · A Chenile service without a REST controller

Historically, an annotation-based Chenile service was a Spring `@RestController` that extended `ControllerSupport` and exposed each operation with a `@PostMapping` that called `process(...)`. That coupled *defining* a service to *exposing it over HTTP*.

Now the two are separate. Annotate an ordinary bean with `@ChenileController` and mark its operations with `@ChenileOperation`:

```java
@Component
@ChenileController(value = "s1Service", serviceName = "_s1Service_",
                   healthCheckerName = "s1HealthChecker")
public class S1ServiceImpl implements S1Service {

    @Override
    @ChenileOperation("op1")
    public S1Entity op1(S1Entity entity) {
        entity.id = "S1ServiceImpl";       // just business logic
        return entity;
    }
}
```

There is **no `@RestController`** here and nothing extends `ControllerSupport`. At startup, `AnnotationChenileServiceInitializer` (in `chenile-core`) finds every `@ChenileController` bean that is *not* a `@RestController`, builds a `ChenileServiceDefinition` from the annotation, reads its `@ChenileOperation` methods, resolves the service interface (or you name it via `interfaceClass`), and registers it as a first-class Chenile service.

<div class="callout key">
  <div class="t">What "decoupled" buys you</div>
  The bean is now a real Chenile service — it runs inside the interception pipeline (security, tenancy, logging, i18n), can be invoked through <a href="/concepts/09-registry-and-proxies/">proxies</a>, driven by <a href="/concepts/07-messaging-abstraction/">messaging</a> or a <a href="/concepts/06-bdd-testing/">workflow</a> — <strong>without any HTTP or Spring-MVC coupling</strong>. HTTP exposure becomes an opt-in layer, not a prerequisite.
</div>

### Want REST as well?

Keep using the HTTP path when you *do* want REST: annotate the class with `@RestController` too. `chenile-http` then adds the Spring-MVC-specific operation metadata and request mappings on top of the same service. The point is that this is now a **choice** — HTTP controllers are handled by `chenile-http`; non-HTTP services are handled by `chenile-core`. One annotation model, two independent responsibilities:

| You write | Registered by | You get |
|---|---|---|
| `@ChenileController` on a plain bean | `chenile-core` · `AnnotationChenileServiceInitializer` | A Chenile service (pipeline, proxies, messaging, STM) — no HTTP |
| `@ChenileController` **+** `@RestController` | `chenile-http` · `HttpAnnotationChenileServiceInitializer` | The same service, **plus** REST endpoints |

## 2 · Make service-registry registration optional

By default a Chenile service publishes its remote service/operation/parameter definitions into the [service registry](/concepts/09-registry-and-proxies/) so that proxies and other services can discover and call it. That isn't always wanted — a purely internal helper, a mock, or a service reached only in-process adds noise to the registry.

`@ChenileController` now carries a flag to control this:

```java
@Component
@ChenileController(value = "s1Service", serviceName = "_s1Service_",
                   registerInServiceRegistry = false)   // ← do not publish to the registry
public class S1ServiceImpl implements S1Service { /* … */ }
```

`registerInServiceRegistry` defaults to `true` (unchanged behaviour). Set it to `false` and the service is still fully wired into the Chenile runtime — interceptors, health check, operations, everything — but its definition is **not** pushed into `chenile-service-registry`. Both initializers honour the flag by setting `ChenileServiceDefinition.setRegisterInServiceRegistry(...)`.

<div class="callout">
  <div class="t">When to turn it off</div>
  Internal-only services, test doubles / mocks, and services you never intend to reach through a remote proxy are good candidates. Leave it on (the default) for anything other services should be able to discover and call.
</div>

## The annotation, at a glance

`@ChenileController` (in `org.chenile...annotation`) exposes these fields:

- `value` — the service **id**.
- `serviceName` — the bean name of the implementation (defaults to `_<id>_`, or the bean name in the non-HTTP path).
- `serviceModule`, `bluePrintName`, `additionalAttributes` — metadata for the service definition.
- `healthCheckerName`, `mockName` — optional companion beans (default to `<id>HealthChecker` / `<id>Mock`).
- `interfaceClass` — the service interface; if left as `Object.class`, Chenile computes it from the operations.
- `registerInServiceRegistry` — **`true` by default**; set `false` to skip registry publication.

Methods are marked with `@ChenileOperation("<opName>")`.

<div class="callout"><div class="t">Where to look</div>
Non-HTTP registration: <code>org.chenile.core.init.AnnotationChenileServiceInitializer</code> ("Registers non-HTTP Chenile controllers"). HTTP registration: <code>org.chenile.http.init.HttpAnnotationChenileServiceInitializer</code>. Annotations: <code>ChenileController</code>, <code>ChenileOperation</code>. Model: <code>ChenileServiceDefinition</code> (<code>registerInServiceRegistry</code>).</div>
