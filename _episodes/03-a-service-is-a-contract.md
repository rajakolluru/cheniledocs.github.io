---
title: "A service is a contract: definition vs. implementation"
order: 3
duration: "8–10 min"
summary: "The core move. Split each service into an api module consumers depend on and a service module nobody depends on — the Dependency Inversion Principle, made physical."
---

**Episode goal:** teach the definition/implementation split concretely, using the file layout, so the viewer can recognize (and defend) the boundary.

<div class="script">
  <div class="beat k">Cold open</div>
  <div class="beat v"><strong>On camera:</strong> “Ask five engineers what a service <em>is</em> and you’ll get five answers. Here’s the one that makes everything else fall into place: a service is a <em>contract</em>, not a codebase.”</div>

  <div class="beat k">Principle</div>
  <div class="beat v"><strong>Voiceover:</strong> “Consumers should depend on what a service <em>promises</em>, never on how it keeps the promise. That’s the Dependency Inversion Principle. Chenile makes it something you can see in the file system.”</div>

  <div class="beat k">On screen</div>
  <div class="beat v">Reveal the two-module tree: <code>s1-api</code> (model + interface) and <code>s1-service</code> (configuration, healthcheck, impl). Highlight the arrow: <code>s2</code> → <code>s1-api</code>, with a red X on any arrow to <code>s1-service</code>.</div>

  <div class="beat k">Voiceover</div>
  <div class="beat v">“The <code>api</code> module is pure contract — the interface and the model. No implementation, no transport, no framework. It’s the smallest thing a caller needs. The <code>service</code> module implements that interface — and <em>nobody</em> depends on it.”</div>

  <div class="beat k">Demo</div>
  <div class="beat v">Open <code>S1Service.java</code> in <code>api</code>, then <code>S1ServiceImpl.java</code> in <code>service</code>. Point out the impl is almost empty — one business line. “No auth. No logging. No tenant lookup. That’s deliberate.”</div>

  <div class="beat k">Health check</div>
  <div class="beat v">Show <code>S1HealthChecker</code>. “Every Chenile service ships a deep readiness probe, so an orchestrator can decide when to route traffic or recycle an instance.”</div>

  <div class="beat k">The seam</div>
  <div class="beat v"><strong>Voiceover:</strong> “Chenile customizes the controller so a service is <em>declared</em> to the framework, not just exposed. That declaration creates a seam <em>around</em> each operation — and that seam is where all the horizontal stuff will attach. No policy ever has to live inside the implementation.”</div>

  <div class="beat k">Key line</div>
  <div class="beat v"><strong>Lower third:</strong> “Depend on <code>s1-api</code>. Never on <code>s1-service</code>.”</div>

  <div class="beat k">Cliffhanger</div>
  <div class="beat v">“Next episode we generate this from scratch and run it — then we start filling that seam with policies.”</div>

  <div class="beat k">Recap card</div>
  <div class="beat v">“A service is a contract. Definition in <code>api</code>, implementation in <code>service</code>, dependencies point at the abstraction.”</div>
</div>

**Companion reading:** [Separate the service definition from the implementation](/concepts/02-definition-vs-implementation/)
