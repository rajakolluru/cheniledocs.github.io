---
title: "Where policies live: the API gateway and the last mile"
short: "Where policies live"
order: 4
summary: "Some policies belong at the edge; others must run beside the service. Most real systems need both — and choosing well is an architectural decision, not a framework limitation."
---

## A request crosses two very different places

Between a client and your business logic, a request passes through two natural checkpoints:

- **The API gateway** — the *edge*. The first thing that sees external traffic. One place, in front of many services.
- **The last mile** — *inside* the service, in the interception pipeline that runs immediately around the operation. Many places, each with full domain context.

A service policy can, in principle, run at either checkpoint. The interesting engineering question is *which policy belongs where* — and the honest answer is that it depends on what the policy needs to know.

## What the gateway is good at

The gateway sees traffic before it fans out to services. That makes it the right place for policies that should act **early, coarsely, and for everyone**:

- **Authentication.** Terminate tokens/sessions once, at the edge, and reject anonymous or invalid traffic before it costs you anything downstream.
- **Coarse authorization.** Is this caller allowed to reach this API family at all?
- **Rate-limiting and quota.** Shed abusive load before it reaches a single service instance.
- **Request normalization.** Canonicalize headers, correlation IDs, protocol translation.
- **TLS termination and routing.**

The gateway's superpower is **leverage**: one configuration protects everything behind it. Its limitation is **context**: it does not know that *this* order belongs to *that* tenant, or that user X may edit only their own records.

<div class="callout key">
  <div class="t">Rule of thumb</div>
  If a policy can decide correctly using only the request itself — identity, headers, rate — it is a strong candidate for the <strong>gateway</strong>.
</div>

## What the last mile is good at

The last mile runs inside the service, where the domain model, the datastore, and the business rules are all present. That makes it the right place for policies that need **rich context**:

- **Fine-grained authorization.** "May this user modify this specific resource?" needs the resource, which only the service has.
- **Multi-tenancy.** Resolving, enforcing and propagating the tenant boundary around data access.
- **Idempotency and business-aware retries.** Safe replays defined in terms of the operation's semantics.
- **Domain logging, metrics and auditing.** Logs that mean something because they carry business identifiers.
- **Internationalization** of domain messages and validation output.

The last mile's superpower is **context**. Its limitation is **reach**: a policy applied only at the last mile does nothing for traffic that a service never should have received in the first place.

## Why most systems need both — defence in depth

Placing a policy is rarely "either/or." The strongest designs apply complementary policies at both checkpoints:

<div class="split" style="margin:1.6em 0">
  <div class="panel">
    <h3>🛡️ At the gateway</h3>
    <ul>
      <li>Authenticate the caller once</li>
      <li>Reject unauthenticated / over-limit traffic</li>
      <li>Coarse "can this caller reach this API?" checks</li>
      <li>Attach identity + correlation for downstream use</li>
    </ul>
  </div>
  <div class="panel">
    <h3>🎯 At the last mile</h3>
    <ul>
      <li>Trust the pre-authenticated identity</li>
      <li>Enforce "can they touch <em>this</em> resource?"</li>
      <li>Apply tenant, idempotency, i18n, audit</li>
      <li>Never assume the edge is the only door</li>
    </ul>
  </div>
</div>

Authentication at the edge keeps junk out cheaply; fine-grained authorization at the last mile protects each resource even if traffic arrives by another path (an internal caller, a message, a future gateway). That redundancy is not waste — it is **defence in depth**.

## The catch — and the setup for Chenile

There is a reason teams *don't* do this cleanly today: the gateway and the service are usually built with **different technologies and different programming models**. A policy written for the gateway is not the same code as the equivalent check inside the service. So you implement authorization twice, in two styles, and they drift.

What if the *same* policy abstraction ran in both places, and configuration — not code — decided where each policy applied? That is exactly what Chenile does. On to [part 5](/concepts/05-how-chenile-helps/).
