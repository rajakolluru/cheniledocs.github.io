---
title: "Service policies: interceptors that do one thing"
order: 5
duration: "8–10 min"
summary: "Give the horizontal concerns a home. A service policy is a single-responsibility, configuration-driven, order-agnostic interceptor in the Chenile pipeline."
---

**Episode goal:** define "service policy" precisely and show why the three interceptor rules make policies reusable and safe to compose.

<div class="script">
  <div class="beat k">Cold open</div>
  <div class="beat v"><strong>On camera:</strong> “Last episode our service was pure business logic. Great — but the auth, logging and tenancy have to live <em>somewhere</em>. That somewhere is a service policy.”</div>

  <div class="beat k">Definition</div>
  <div class="beat v"><strong>Lower third:</strong> “A service policy = an implementation of a horizontal requirement that cuts across services.” Voiceover: “In Chenile, a policy is an <em>interceptor</em> that runs around a service operation.”</div>

  <div class="beat k">On screen</div>
  <div class="beat v">Animate a request becoming a <code>ChenileExchange</code>, then passing through a stack of interceptors — security, tenancy, i18n, logging — before reaching the impl, and back out again.</div>

  <div class="beat k">The three rules</div>
  <div class="beat v"><strong>Voiceover, one at a time:</strong> (1) <strong>One and only one</strong> — each interceptor implements a single policy; and only one interceptor owns a given policy, so there’s exactly one place to fix it. (2) <strong>Configuration-driven</strong> — steered by typed extension keys supplied at deploy time, not hard-coded. (3) <strong>Orchestration-unaware</strong> — it never assumes its position; it may declare before/after payload, but never hard-wires order.</div>

  <div class="beat k">Why it matters</div>
  <div class="beat v"><strong>Voiceover:</strong> “Those three rules are what make a policy testable in isolation, reusable across services, and changeable in one place. That’s the opposite of the duplicated plumbing from episode two.”</div>

  <div class="beat k">Demo</div>
  <div class="beat v">Show a simple interceptor implementing one policy (e.g. request logging or an error envelope). Attach it via service-registry configuration — no change to the service impl. Call the service; show the policy firing.</div>

  <div class="beat k">Contrast</div>
  <div class="beat v">Split screen: the old inline version (business logic tangled with a try/catch and a user lookup) vs. the Chenile version (clean impl + one interceptor). “Same behavior. One of these you can reuse.”</div>

  <div class="beat k">Cliffhanger</div>
  <div class="beat v">“Now the interesting question. If a policy isn’t welded to a service, <em>where</em> should it run? Next: the gateway and the last mile.”</div>

  <div class="beat k">Recap card</div>
  <div class="beat v">“A policy is a single-responsibility, config-driven, order-agnostic interceptor. Write it once; attach by configuration.”</div>
</div>

**Companion reading:** [Service policies: the other half of the division](/concepts/03-service-policies/)
