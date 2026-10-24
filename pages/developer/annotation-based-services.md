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

### Marking the exchange body: `@ChenileBody` <span class="pill">2.1.31</span>

Mark the parameter that receives the body of the `ChenileExchange` with `@ChenileBody` (`org.chenile.core.annotation`). In 2.1.31 `@ChenileController` itself is supplied by `chenile-core` (same package name, so sources compile unchanged), which means a headless service needs **no `chenile-http` dependency at all** — it can serve in-process callers, events and serverless hosts. The [`chenile-headless-service` blueprint](/developer/jgen-blueprints/#headless) generates exactly this shape:

```java
@ChenileController(value = "ordersService", serviceName = "_ordersService_")
public class OrdersController {
    @ChenileOperation("place")
    public Order place(@ChenileBody Order order) { … }
}
```

The annotation-initialization lifecycle now lives in core; the HTTP initializer inherits it and adds only Spring MVC controller selection and route mapping.

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

To make a **whole deployable** a registry *consumer* that publishes nothing, set:

```properties
chenile.service.registry.read-only=true
```

Read-only mode keeps registry reads and local cache loading, but blocks both automatic publication at startup and direct delegate `save(...)` calls before any outbound HTTP write. *(2.1.31)*

<div class="callout">
  <div class="t">When to turn it off</div>
  Internal-only services, test doubles / mocks, and services you never intend to reach through a remote proxy are good candidates. Leave it on (the default) for anything other services should be able to discover and call.
</div>

## 3 · HTTP mapping rules <span class="pill">2.1.31</span>

For HTTP controllers, a single `SpringMvcMappingProducer` reads all five composed Spring annotations (`@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping`) **and** direct `@RequestMapping` declarations. A Chenile operation must resolve to **exactly one HTTP verb**; several verbs are **rejected at startup**.

<span class="pill">2.1.33</span> An operation may have **several paths**. Every alias is registered against the same handler and the same operation definition, so interceptors, event subscriptions and invocation are shared, and path variables come from whichever route actually matched. In JSON definitions use `urls` (alone or alongside `url`; `getUrl()` stays the canonical one):

```json
{ "name": "getCustomer", "httpMethod": "GET",
  "url": "/customers/{id}", "urls": ["/customers/{id}/details"] }
```

When an operation's implementation throws, the `CANNOT_INVOKE_TARGET` error (E509) now names the operation and the exception type and carries the underlying message — so the `description` your client receives in the `GenericResponse` points at the real cause.

## The annotation, at a glance

`@ChenileController` (in `org.chenile...annotation`) exposes these fields:

- `value` — the service **id**.
- `serviceName` — the bean name of the implementation (defaults to `_<id>_`, or the bean name in the non-HTTP path).
- `serviceSelector` <span class="pill">2.1.35</span> — optional bean name of a `ServiceSelector` that picks the implementation **per request** (returning `null` keeps `serviceName`). Mock and trajectory overrides still take precedence. See [choosing the implementation per request](/developer/runtime-internals/#choosing-the-implementation-per-request).
- `serviceModule`, `bluePrintName`, `additionalAttributes` — metadata for the service definition.
- `healthCheckerName`, `mockName` — optional companion beans (default to `<id>HealthChecker` / `<id>Mock`).
- `interfaceClass` — the service interface; if left as `Object.class`, Chenile computes it from the operations.
- `registerInServiceRegistry` — **`true` by default**; set `false` to skip registry publication.

Methods are marked with `@ChenileOperation("<opName>")`; the exchange-body parameter with `@ChenileBody`.

<div class="callout"><div class="t">Where to look</div>
Non-HTTP registration: <code>org.chenile.core.init.AnnotationChenileServiceInitializer</code> ("Registers non-HTTP Chenile controllers"). HTTP registration: <code>org.chenile.http.init.HttpAnnotationChenileServiceInitializer</code>. Annotations: <code>ChenileController</code>, <code>ChenileOperation</code>. Model: <code>ChenileServiceDefinition</code> (<code>registerInServiceRegistry</code>).</div>

## Service-provided response headers

A service result can implement `org.chenile.base.response.ResponseHeadersAware` to provide
response headers. The interface lives in `chenile-base`; service APIs need no dependency on
`chenile-http`, servlet response objects, or Spring `ResponseEntity`.

```java
public record CreatedItem(String id) implements ResponseHeadersAware {
    @Override
    @JsonIgnore
    public Map<String, List<String>> getResponseHeaders() {
        return Map.of("Location", List.of("/items/" + id));
    }
}
```

The service returns `CreatedItem` as usual. Chenile copies its headers before wrapping the result
in `GenericResponse`. The JSON payload remains `{"id":"..."}`; `responseHeaders` is excluded
from JSON by the interface's `@JsonIgnore` annotation. Annotating the overriding method as well
makes the intent explicit. Ordinary result objects continue to work unchanged.

Set a fixed HTTP status through existing operation metadata. For an asynchronous acknowledgement,
use `@ChenileResponseCodes(success = 202, warning = 202)` on the controller operation, or configure
the corresponding success/warning status in the JSON operation definition. Both the HTTP status
and `GenericResponse.code` then reflect that configuration. Controllers simply call `process(...)`.

`ChenileExchange` keeps response headers separate from incoming headers. Interceptors can call
`setResponseHeader(name, value)` to replace a header or `addResponseHeader(name, value)` to append.
Names are case insensitive; values retain their order. `getResponseHeaders()` returns an immutable
snapshot. Headers provided by the result are appended to any headers already set by interceptors.

Both annotated controllers (`ControllerSupport`) and configured endpoints (`HttpEntryPoint`) emit
the same metadata and preserve repeated values, including warnings. Request headers are never
implicitly echoed. A failure discards success headers, including a previously selected `Location`.
Invalid names, control characters in values, and transport-managed headers cause an error rather
than being written. The adapter owns Content-Type, Content-Length, Transfer-Encoding, Connection,
Keep-Alive, Proxy-Authenticate, Proxy-Authorization, TE, Trailer, and Upgrade.

Use standard names for standard headers (`Location`, `ETag`, `Retry-After`). Custom Chenile headers
use the `x-` prefix. Response headers do not enter the request context or propagate automatically
into nested calls. Direct Java callers keep the same result type; asynchronous adapters do not
turn HTTP response metadata into outgoing event headers. Transparent forwarding of remote-proxy
response headers is outside this contract.

The trigger acknowledgement is a concrete example: `TriggerResult` exposes
`Location: /trigger/<outbox-id>`, and the trigger operation configures HTTP 202. Its controller
contains no special response-header or status-rewriting logic. Header publication does not change
the guarantee that durable acceptance commits before the acknowledgement is returned.

## Service blueprint controller pattern

New service controllers follow the `bp-service` blueprint. Put shared models and external
service/reader interfaces in `name-api`, and implementations, repositories, wiring, and HTTP
controllers in `name-service`. Use `@RestController`, `@ChenileController`, and `ControllerSupport`;
each operation delegates to `process(...)` with all bound arguments in service-signature order.
Controllers do not call implementations/repositories directly or handle validation and transactions.
Use typed Chenile envelopes, Chenile exceptions, configured response codes, and header-aware result
objects. Persistence scans belong to the host application rather than library configuration.

BDD uses Cucumber REST steps from `cucumber-utils`, Spring glue, and the real Chenile highway and
service implementation. Pass tenant headers explicitly and cover persistence, errors, tenant
isolation, and external effects at the proper transaction boundary. The split `crontab-api` and
`crontab-service` modules provide an example, including the `/crontab` controller and feature suite.
