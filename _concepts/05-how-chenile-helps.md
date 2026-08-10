---
title: "How Chenile implements policies at the gateway and the last mile"
short: "How Chenile helps"
order: 5
summary: "One interceptor abstraction, two deployment sites. Write a policy once; the service registry decides whether it runs at the edge, at the last mile, or both."
---

## One abstraction, two homes

Chenile's answer to the placement problem in [part 4](/concepts/04-policy-placement/) is deliberately simple: **there is only one kind of policy.**

A policy is a Chenile interceptor. The very same interceptor contract runs in two places:

- inside the **auth gateway** shipped in `chenile-security`, at the edge, and
- inside every service's **interception pipeline**, at the last mile.

You do not write a "gateway version" and a "service version" of authorization. You write the policy once, and you deploy it where it belongs.

<div class="callout key">
  <div class="t">The Chenile promise</div>
  Write a service policy once. Run it at the API gateway, at the last mile, or both — chosen by <strong>configuration in the service registry</strong>, not by rewriting code.
</div>

## The registry decides placement

Every Chenile service has an entry in the **service registry** (`chenile-service-registry`). That entry is where operations are described and where policies are attached, through typed **extension keys** ([part 3](/concepts/03-service-policies/)). Because placement and tuning are configuration, moving a policy from the last mile to the gateway — or adding it in both places for defence in depth — is a registry change, not a refactor.

```text
gateway:                          last mile (per service):
┌──────────────────────────┐      ┌───────────────────────────────┐
│  Chenile auth gateway     │      │  Chenile interception pipeline │
│  ─ authenticate (policy)  │─────▶│  ─ authenticate? (trusted)     │
│  ─ rate-limit  (policy)   │      │  ─ authorize resource (policy) │
│  ─ coarse authz (policy)  │      │  ─ tenancy      (policy)       │
└──────────────────────────┘      │  ─ i18n / audit (policy)       │
        edge                       │  ─▶ S1ServiceImpl.op1()        │
                                   └───────────────────────────────┘
   same interceptor contract in both boxes
```

## What Chenile gives you out of the box

The pieces that make this work are spread across the framework's repositories, but they compose into one model:

- **`chenile-core`** — the runtime substrate: the `ChenileExchange` model, the interceptor/orchestration pipeline, service and operation definitions, HTTP binding and state-machine support. This is the engine that runs policies at the last mile.
- **`chenile-security`** — the contract-first auth framework: `auth-server`, **`gateway`**, and `resource-server` starters, plus the `security-interceptor`. This is how policies run at the edge, and how services trust the edge's decisions.
- **`chenile-service-registry`** — the registry that binds policies to operations and carries their configuration.
- **`chenile-proxies`** — call other Chenile services through their interface, locally or remotely, without hand-written transport, so the same policy model spans in-process and cross-process calls.
- **`chenile-messaging`** — extends the model beyond HTTP to pub/sub (MQTT, Kafka, Azure, in-JVM) and the cloud-edge switch, so policies apply to event-driven entry points too.

Because a policy is configuration-driven and orchestration-unaware, the *same* authorization interceptor can guard an HTTP request at the gateway, an internal proxy call at the last mile, and a message consumed from a queue.

## Bringing the whole story together

<div class="callout">
  <div class="t">The five moves, in one breath</div>
  <strong>1.</strong> We adopt microservices (or moduliths) for deployability, ownership and blast-radius control — and pay a hidden tax in duplicated plumbing.<br/>
  <strong>2.</strong> So we split each service into a <em>definition</em> (<code>api</code>) that consumers depend on and an <em>implementation</em> (<code>service</code>) that nobody depends on.<br/>
  <strong>3.</strong> The horizontal concerns become named <em>policies</em> — single-responsibility, configuration-driven interceptors — instead of inline code.<br/>
  <strong>4.</strong> Policies must run in two places: the <em>API gateway</em> for early, coarse, high-leverage decisions, and the <em>last mile</em> for context-rich ones.<br/>
  <strong>5.</strong> Chenile uses <em>one interceptor abstraction for both</em>, with the service registry choosing placement — so you write a policy once and govern every entry point consistently.<br/>
</div>

That is Chenile: **business logic stays pure, governance stays consistent, and where each policy runs is a decision you make in configuration — not a rewrite.**

<p style="margin-top:2em"><a class="btn btn-primary" href="/get-started/">Generate your first service →</a> &nbsp; <a class="btn btn-ghost" href="/video-series/">Watch the video series</a></p>
