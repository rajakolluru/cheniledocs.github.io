---
title: "Service registry & proxies: client-side interception"
order: 11
duration: "10–12 min"
summary: "Chenile ships its own registry and a proxy framework: call a service through its interface, routed locally or remotely, with a configurable client-side interceptor chain on the way out."
---

**Episode goal:** demonstrate the client side of Chenile — a proxy that implements the target interface, dynamic local/remote routing, and a client-side interceptor chain that mirrors the server pipeline.

<div class="script">
  <div class="beat k">Cold open</div>
  <div class="beat v"><strong>On camera:</strong> “We spent the series on the server side of a call. But every service is also a <em>client</em>. Chenile treats the outbound side with the exact same respect — no hand-written transport, and interception on the way out.”</div>

  <div class="beat k">The registry</div>
  <div class="beat v"><strong>On screen:</strong> <code>chenile-service-registry</code>. Voiceover: “Chenile ships its own service registry — remote service, operation and parameter definitions. DB-backed, cached, fingerprinted for change detection, with a delegate that lets a client pull a service’s definitions. It’s the same registry that carries a service’s policies.”</div>

  <div class="beat k">Build a proxy</div>
  <div class="beat v"><strong>Demo:</strong> <code>proxyBuilder.buildProxy(BService.class, "bService", headerCopier)</code>. “The object it returns <em>implements</em> BService. I call <code>bService.op(payload)</code> like a local object — Chenile handles everything else. <code>HeaderCopier</code> carries correlation, identity and tenant outward.”</div>

  <div class="beat k">Local or remote</div>
  <div class="beat v"><strong>Lower third:</strong> “Same caller code — local or remote.” Show <code>ProxyTypeRouter</code>: if the callee is in the same JVM → synchronous <code>LocalProxyInvoker</code> (that’s your modulith); if remote → <code>RemoteProxyInvoker</code> over HTTP, or an event via <code>ChenilePubSub</code>.</div>

  <div class="beat k">Demo — seamless swap</div>
  <div class="beat v">Run with the callee co-located (local, in-process). Then deploy it separately and re-run the identical caller code — now it goes remote. “I changed deployment, not code. That’s <code>ProxyMode.COMPUTE_DYNAMICALLY</code>.”</div>

  <div class="beat k">Client-side interception</div>
  <div class="beat v"><strong>Voiceover:</strong> “Now the payoff. On the way out, the proxy runs a <em>client-side interceptor chain</em> — Chenile calls them client processors — against a <code>RemoteChenileExchange</code>.” Show chips: header propagation, auth token, correlation, logging, retry/timeout, and the response handler + body-type selector.</div>

  <div class="beat k">Per service / per operation</div>
  <div class="beat v">Point at <code>ServiceSpecificClientProcessorsInterpolation</code> and <code>OperationSpecificClientProcessorsInterpolation</code>. “The chain is configurable per service and per operation. Add a retry to one operation, an extra header to one service — by configuration.”</div>

  <div class="beat k">The symmetry</div>
  <div class="beat v"><strong>Lower third:</strong> “Server pipeline in; client-processor chain out. One interception philosophy, both directions.”</div>

  <div class="beat k">Recap card</div>
  <div class="beat v">“Registry + proxy: call the interface, route local/remote dynamically, intercept on the client side — all by configuration.”</div>
</div>

**Companion reading:** [Service registry &amp; proxies: calling services through their interface](/concepts/09-registry-and-proxies/)
