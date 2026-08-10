---
title: "Service policies: the other half of the division"
short: "Service policies"
order: 3
summary: "Horizontal requirements — security, logging, tenancy, i18n, retries — are not business logic. Chenile names each one a policy and implements it as a single-responsibility interceptor."
---

## Two kinds of requirements

Every service has to satisfy two very different kinds of requirements:

- **Functional (vertical) requirements** — what *this* service uniquely does. Price a cart. Reserve inventory. These belong in the implementation.
- **Horizontal requirements** — concerns that cut across *every* service: authentication, authorization, logging, error handling, multi-tenancy, i18n, retries, idempotency, rate-limiting, metrics.

The mistake most systems make is writing the second kind in the same place as the first. Separating service definition from implementation ([part 2](/concepts/02-definition-vs-implementation/)) only pays off if the horizontal requirements *also* have a home that is not the business code.

<div class="callout key">
  <div class="t">Definition</div>
  A <strong>service policy</strong> is an implementation of a horizontal requirement that cuts across multiple services. In Chenile, a policy is realized as an <strong>interceptor</strong> in the interception pipeline that runs around a service operation.
</div>

## Policies are interceptors, and interceptors have rules

When a request enters a Chenile service it is normalized into a `ChenileExchange` and passed through an **interception pipeline** before (and after) the service implementation runs. Each interceptor implements exactly one policy. Chenile's guidelines make policies safe to compose:

1. **One and only one.** An interceptor implements a single policy — the Single Responsibility Principle. And by DRY, only one interceptor is responsible for a given policy, so there is exactly one place to fix it.
2. **Configuration-driven.** An interceptor is steered by configuration supplied when the service is deployed, not by hard-coded constants. The service-registry entry carries typed **extension keys**, and each interceptor defines its own schema for the keys it reads.
3. **Orchestration-unaware.** An interceptor assumes only that it will be somewhere in the stack before the service is called. It does not assume a position. It may declare that it runs *before* or *after* payload interception, which guides architects assembling the stack — but it never hard-wires order.

Because of these rules, policies are **testable in isolation**, **reusable across services**, and **changeable in one place**.

## What you stop writing

Once the common concerns are policies, the things that used to clutter every service disappear from the business code:

<div class="split" style="margin:1.6em 0">
  <div class="panel bad">
    <h3>❌ Inline, per service</h3>
    <ul>
      <li>Reading the principal and checking roles by hand</li>
      <li>Copy-pasted try/catch and error envelopes</li>
      <li>Ad-hoc logging and correlation IDs</li>
      <li>Tenant lookups sprinkled through methods</li>
      <li>Bespoke retry/idempotency wrappers</li>
    </ul>
  </div>
  <div class="panel good">
    <h3>✅ As a policy, once</h3>
    <ul>
      <li>A security interceptor resolves and authorizes the caller</li>
      <li>An error-handling policy owns the response envelope</li>
      <li>A logging policy standardizes structured logs</li>
      <li>A tenancy policy resolves and propagates the tenant</li>
      <li>A resiliency policy applies retries/idempotency</li>
    </ul>
  </div>
</div>

## The payoff sets up the next question

A policy is a self-contained, configuration-driven unit of horizontal behavior. That property is what makes the *placement* question tractable: if a policy is not welded into a service, you are free to decide **where** it should execute.

Some policies are best applied at the edge, before traffic ever reaches a service. Others must run right next to the service, where the domain context lives. That is [part 4](/concepts/04-policy-placement/).
