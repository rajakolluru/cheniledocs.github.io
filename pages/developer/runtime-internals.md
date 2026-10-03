---
layout: doc
title: Runtime internals — the exchange and the interceptor chain
description: How a request becomes a ChenileExchange, flows through the chenile-highway interceptor chain, gets typed and bound to your method, and comes back as a GenericResponse — for HTTP and events alike.
permalink: /developer/runtime-internals/
---

# Runtime internals — the exchange and the interceptor chain

Every Chenile entry point — HTTP, an event, a proxy call, a scheduler tick, an MCP tool call — ends up in the same place: a **`ChenileExchange`** pushed through one **interceptor chain**. This guide follows a request through that machinery so you can read, debug and extend it. For the concepts behind it, see [service policies](/concepts/03-service-policies/) and [Owiz](/concepts/10-owiz/).

## The exchange

`ChenileExchange` (`chenile-core/…/core/context/ChenileExchange.java`) is a **bidirectional** context: it starts as an incoming request and ends as an outgoing response, and every interceptor reads or writes it. Its fields fall into four groups:

| Group | Fields | Filled by |
|---|---|---|
| Incoming request | `headers`, `multiPartMap`, `locale`, `body` | the transport adapter (e.g. `HttpEntryPoint`) |
| Routing & contract | `serviceDefinition`, `operationDefinition`, `bodyType` | entry point; type selection |
| Invocation | `serviceReference`, `method`, `apiInvocation` | service resolution; argument binding |
| Outgoing | `response`, `exception`, `httpResponseStatusCode`, `responseMessages` | invocation and the unwinding chain |

Exchanges are created either by a transport (`HttpEntryPoint` builds one per HTTP request, putting path variables into `headers`) or **programmatically** by `ChenileExchangeBuilder`, which looks up the service and operation by name and can copy framework headers through a `HeaderCopier` — the path used by `ControllerSupport`, proxies and internal integrations.

## The chain is XML — `chenile-highway`

The pipeline skeleton lives in `chenile-core/src/main/resources/org/chenile/core/chenile-core.xml` and is loaded by `ChenileCoreConfiguration` (property `chenile.interceptors.path`):

```xml
<flow id='chenile-highway' defaultFlow="true">
  <chenile-highway first="true">
    <chenile-interceptor-chain>
      <log-output/>
      <generic-response-builder/>
      <exception-handler-interpolation/>
      <validate-copy-headers/>
      <pre-processors-interpolation/>
      <transformation-class-selector/>
      <transformer/>
      <construct-service-reference/>
      <post-processors-interpolation/>
      <operation-specific-processors-interpolation/>
      <service-specific-processors-interpolation/>
      <service-invoker/>
    </chenile-interceptor-chain>
  </chenile-highway>
</flow>
```

[Owiz](/concepts/10-owiz/) turns tags into commands: kebab-case becomes camelCase, which is looked up as a Spring bean (`<service-invoker/>` → `serviceInvoker`), falling back to instantiating a class of that name. Nesting means attachment, and inside a `Chain` attachment order is execution order.

### Fixed commands and interpolations

Most entries do work themselves. Five are **interpolation commands** — placeholders that expand, per exchange, into a list of commands (`Chain` detects `InterpolationCommand`):

| Interpolation | Expands to | Configured by |
|---|---|---|
| `exceptionHandlerInterpolation` | the configured exception handler | `chenile.exception.handler` |
| `preProcessorsInterpolation` | deployable-wide pre-processors | `chenile.pre.processors` |
| `postProcessorsInterpolation` | deployable-wide post-processors | `chenile.post.processors` |
| `operationSpecificProcessorsInterpolation` | interceptors on the operation | `interceptorComponentNames` / `@InterceptedBy` |
| `serviceSpecificProcessorsInterpolation` | interceptors on the service | service-level `interceptorComponentNames` |

That is how one fixed skeleton carries per-deployable, per-service and per-operation [policies](/concepts/03-service-policies/).

## One request, forward and back

| # | Command | What it does |
|---|---|---|
| 1 | `logOutput` | enters and delegates; logs the final state on the way back |
| 2 | `genericResponseBuilder` | wraps almost everything so it can normalize success or failure |
| 3 | exception handler | catches downstream failures |
| 4 | `validateCopyHeaders` | ensures a request id; copies external `x-…` headers into `ContextContainer`; **rejects incoming `x-p-…` headers** (protected, framework-internal) |
| 5 | pre-processors | deployable-wide policies |
| 6 | `transformationClassSelector` | decides the Java body type (`exchange.bodyType`) |
| 7 | `transformer` | deserializes the raw JSON body into that type (bad request on failure) |
| 8 | `constructServiceReference` | picks the target bean and method — honouring **mock** mode and [trajectory](/concepts/14-trajectories/) overrides |
| 9 | post-processors | deployable-wide policies |
| 10 | operation-specific interceptors | e.g. a security or logging policy on one operation |
| 11 | service-specific interceptors | policies on the whole service |
| 12 | `serviceInvoker` | binds arguments and invokes your method reflectively |

Most interceptors extend `BaseChenileInterceptor` (`doPreProcessing` → continue → capture exceptions → `doPostProcessing` in `finally`), so the XML is a **nested call stack**, not a one-way filter list. On the way back, the response builder turns the result or exception into a `GenericResponse`, sets the HTTP status and copies warnings; the transport then writes `response`, `exception`, `httpResponseStatusCode` and `responseMessages` out.

## Typing the body

Type selection and deserialization are separate steps because the target type isn't always fixed:

- **Default:** the operation's `input` class becomes `bodyType`.
- **Body-type selectors:** declared as `bodyTypeSelectorComponentNames` in JSON or `@BodyTypeSelector("…")` on a controller method — both produce the same `OperationDefinition.bodyTypeSelector` command, which computes `bodyType` from headers or the exchange. Workflow services use this to give every event its own payload type.
- **Subclasses:** `SubclassBodyTypeSelector` + `SubclassRegistry` read a top-level `"type"` discriminator so a `Vehicle` contract can arrive as a `Car` or `Truck`.

`Transformer` only converts string bodies, then clears `apiInvocation` so arguments are recomputed.

## Binding arguments — keeping services domain-shaped

`ServiceInvoker` builds the Java argument list from the operation's `ParamDefinition`s, so your methods can stay domain-shaped (`Order approve(String orderId, ApprovalCommand cmd)`) instead of taking the exchange:

| Binding type | Argument value |
|---|---|
| `BODY` | the typed `exchange.body` |
| `HEADER` | one named header (path variables land here) |
| `HEADERS` | the whole header map |
| `MULTI_PART` | one named uploaded file |

`paramType` is the public, possibly generic type (`java.util.List<java.lang.String>`), read by tools such as MCP schema generation; `paramClass` is a legacy raw class used for method matching. If both are omitted, body parameters default to the operation `input` and others to `String`.

## Defining services in JSON

Besides [annotations](/concepts/annotation-based-services/), services can be declared in JSON files found by `chenile.service.json.package` (e.g. `classpath*:org/acme/service/*.json`). `ChenileServiceInitializer` parses each into a `ChenileServiceDefinition`, resolves interceptor and body-type-selector bean names, looks up the service, mock and health-checker beans, **validates every operation against a real Java method**, and registers it:

```json
{
  "name": "jsonService", "id": "jsonService",
  "mockName": "jsonServiceMock", "healthCheckerName": "jsonHealthChecker",
  "interceptorComponentNames": ["serviceInterceptor"],
  "operations": [{
    "name": "getOne", "url": "/system/property/{key}", "httpMethod": "GET",
    "produces": "JSON", "consumes": "JSON",
    "interceptorComponentNames": ["jsonInterceptor"],
    "eventSubscribedTo": ["propertyRequested"],
    "params": [{ "name": "key", "type": "HEADER" }]
  }]
}
```

`name` is the implementation bean; `id` is the logical service id used by the registry and trajectories. Operation fields: `name`, `url`, `httpMethod`, `produces`/`consumes` (`JSON`, `TEXT`, `HTML`, `PDF`), `input`, `output`, `interceptorComponentNames`, `bodyTypeSelectorComponentNames`, `eventSubscribedTo` and `params`.

## Events reuse the same chain

Events are named ids (`foo`, `ProcessCreate`, …), optionally declared in JSON found by `chenile.event.json.package` (`{"id":"foo","topic":"/foo","type":"org.acme.Foo"}`). An operation subscribes with `eventSubscribedTo` in JSON or `@EventsSubscribedTo({"event1"})` in code. At `ApplicationReadyEvent`, `ChenileEventSubscribersInitializer` registers every subscriber and **fails startup on a payload-type mismatch**; an undeclared event id gets a minimal definition from the operation's input type.

`EventProcessor.handleEvent(eventId, payload, headers)` creates a fresh exchange **per subscriber** and runs it through `ChenileEntryPoint` — the same interceptors, trajectories, mocks and response normalization as HTTP. That is why [messaging](/concepts/07-messaging-abstraction/), the [scheduler, file-watch](/developer/entry-points/) and [process triggers](/developer/trigger-framework/) all inherit your policies for free.

<div class="callout"><div class="t">Where to look</div>
<code>chenile-core.xml</code>, <code>ChenileCoreConfiguration</code>, <code>ChenileEntryPoint</code>, <code>BaseChenileInterceptor</code>, <code>ValidateCopyHeaders</code>, <code>TransformationClassSelector</code>, <code>Transformer</code>, <code>ConstructServiceReference</code>, <code>ServiceInvoker</code>, <code>GenericResponseBuilder</code>, the <code>interceptors/interpolations</code> package, <code>EventProcessor</code> and <code>ChenileEventSubscribersInitializer</code> in <code>ajapros/chenile-core</code>. Long-form source guides live in <code>chenile-core/docs</code> (exchange lifecycle, interceptor chain, transformation, service invoker, service-definition JSON, events).</div>
