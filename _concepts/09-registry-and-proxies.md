---
title: "Service registry & proxies: calling services through their interface"
short: "Registry & proxies"
order: 9
summary: "Chenile ships its own service registry and a proxy framework. Call another service through its Java interface — Chenile routes the call locally or remotely and runs a client-side interceptor chain on the way out."
---

## The mirror image of the last mile

Everything so far has been about the *server* side of a call — the pipeline that runs around a service implementation. But a service is also a **client** of other services, and the outbound side deserves the same treatment: you shouldn't hand-write transport code, and cross-cutting concerns shouldn't be sprinkled into caller logic.

Chenile provides two pieces that make this work together: its own **service registry** and a **proxy framework** with **client-side interception**.

## Chenile ships its own service registry

`chenile-service-registry` holds the metadata needed to *find and invoke* a service: **remote service definitions**, their **operations**, and each operation's **parameters** (`ChenileRemoteServiceDefinition`, `ChenileRemoteOperationDefinition`, `ChenileRemoteParamDefinition`). It is:

- **DB-backed** with its own controller and repository, so definitions can be managed and evolve;
- **cached** (`ServiceRegistryCache`) and **fingerprinted** (`ServiceRegistryFingerprint`) so clients detect changes efficiently;
- reachable through a **delegate** (`service-registry-delegate` · `ServiceRegistryClientImpl`) that lets a client pull a remote service's definitions.

This is the same registry that carries a service's **policy configuration** — so "how to reach a service" and "what policies apply to it" live in one place.

## The proxy framework: call the interface, not the wire

The proxy framework (`chenile-proxies`) lets one service invoke another **through its Java interface**, with no hand-written transport. You ask Chenile for a proxy of the target interface and just call its methods:

```java
// Build once — a proxy that implements the target service interface
BService bService = proxyBuilder.buildProxy(
        BService.class, "bService", headerCopier /*, ProxyMode */);

// Call it like a local object — Chenile does the rest
BResponse r = bService.op(payload);
```

The returned object **implements `BService`**, so the caller is completely insulated from transport. `HeaderCopier` propagates the relevant headers from the current request outward (correlation, identity, tenant), so context flows across the call.

<p style="text-align:center;margin:2em 0"><img src="/assets/img/chenile-proxy.svg" alt="A client calls a service through its interface; a client-side interceptor chain runs, then the call is routed locally in-VM or remotely over HTTP or events, using the service registry"></p>

## Local or remote — decided dynamically, seamlessly

A `ProxyTypeRouter` decides whether the call is **local** or **remote** — and the caller code is identical either way:

- **Local** (`LocalProxyInvoker`) — if the target is in the same JVM, the proxy makes a direct, synchronous in-process call. This is what lets a **modulith** work: services call each other through proxies today, and can be split apart tomorrow.
- **Remote** (`RemoteProxyInvoker`) — if the target is another service, the proxy invokes it over **HTTP** (`HttpInvoker`), or, for the observer/event style, publishes an event via **`ChenilePubSub`** (the [messaging](/concepts/07-messaging-abstraction/) layer — Kafka, MQTT, etc.). The routing uses the registry's definitions to know how to reach it.

Because placement is dynamic (`ProxyMode.COMPUTE_DYNAMICALLY`), **adding a service proxy on the client side is seamless**: you declare the interface and ask for a proxy; whether the callee is co-located or across the network is a deployment concern, not a code change.

## Client-side interception

Here is the part that mirrors the server. On the way *out*, the proxy runs a **client-side interceptor chain** — Chenile calls these **client processors** — against a `RemoteChenileExchange`. Just like server-side interceptors implement service policies, client processors implement **outbound** policies:

- copy and propagate headers, attach the **auth token** and correlation ID;
- **logging** of the outbound call;
- **retry / timeout** behaviour;
- **response handling** — `ChenileResponseHandler` and a `ResponseBodyTypeSelector` turn the raw response back into typed objects and surface errors consistently.

Crucially, this chain is **configurable per service and per operation** — `ServiceSpecificClientProcessorsInterpolation` and `OperationSpecificClientProcessorsInterpolation` interpolate the right processors for the specific call. So you can add a retry policy to one operation, or an extra header to one service, purely by configuration.

<div class="callout key">
  <div class="t">The symmetry</div>
  Server side: a request runs through the interception pipeline before your implementation. Client side: an outbound call runs through the client-processor chain before it leaves. <strong>One interception philosophy, both directions</strong> — and both configured, not hand-coded.
</div>

<div class="callout">
  <div class="t">Where to look</div>
  Proxy: <code>org.chenile.proxy.builder.ProxyBuilder</code>, <code>invoker.ProxyTypeRouter</code>, <code>LocalProxyInvoker</code> / <code>RemoteProxyInvoker</code>, <code>interceptors.HttpInvoker</code>, <code>ChenileResponseHandler</code>, and the client-processor interpolations. Registry: <code>ChenileRemoteServiceDefinition</code>, <code>ServiceRegistryService</code>, <code>ServiceRegistryClientImpl</code>. Ships in <code>chenile-proxies</code> and <code>chenile-service-registry</code>.
</div>
