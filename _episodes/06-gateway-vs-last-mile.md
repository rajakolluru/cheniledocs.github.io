---
title: "Where policies live: the gateway and the last mile"
order: 6
duration: "8–10 min"
summary: "Two checkpoints, two strengths. The gateway gives leverage; the last mile gives context. Why serious systems apply policies at both — defence in depth."
---

**Episode goal:** give the viewer a decision framework for policy placement, and the "defence in depth" intuition, before revealing Chenile's unified answer next episode.

<div class="script">
  <div class="beat k">Cold open</div>
  <div class="beat v"><strong>On camera:</strong> “A request crosses two very different places on its way to your business logic. Where a policy runs changes what it can do.”</div>

  <div class="beat k">On screen</div>
  <div class="beat v">A pipe from client → <strong>API gateway</strong> → several services, each with a <strong>last-mile</strong> pipeline. Label the two checkpoints clearly.</div>

  <div class="beat k">Gateway strengths</div>
  <div class="beat v"><strong>Voiceover:</strong> “The gateway sees traffic before it fans out. That makes it perfect for early, coarse, high-leverage policies: authentication, rate-limiting, coarse ‘can this caller reach this API family?’, request normalization. Its superpower is leverage — one config protects everything behind it.”</div>

  <div class="beat k">Gateway limit</div>
  <div class="beat v">“But the gateway has no domain context. It doesn’t know this order belongs to that tenant, or that a user may edit only their own records.”</div>

  <div class="beat k">Last-mile strengths</div>
  <div class="beat v"><strong>Voiceover:</strong> “The last mile runs inside the service, where the model and the data live. That’s where context-rich policies belong: fine-grained authorization, multi-tenancy, idempotency, business-aware logging and i18n. Its superpower is context.”</div>

  <div class="beat k">Last-mile limit</div>
  <div class="beat v">“But a last-mile-only policy does nothing for traffic the service never should have received. Reach is the trade.”</div>

  <div class="beat k">The rule of thumb</div>
  <div class="beat v"><strong>Lower third:</strong> “Decidable from the request alone? → gateway. Needs the resource? → last mile.”</div>

  <div class="beat k">Both</div>
  <div class="beat v"><strong>Voiceover:</strong> “Real systems do both. Authenticate at the edge to keep junk out cheaply; authorize the specific resource at the last mile so it’s safe even if traffic arrives another way — an internal call, a message, a future gateway. That redundancy is defence in depth, not waste.”</div>

  <div class="beat k">The catch</div>
  <div class="beat v">“Here’s why teams don’t do this cleanly: the gateway and the service are usually different tech and different programming models. So you write authorization twice, in two styles — and they drift.”</div>

  <div class="beat k">Cliffhanger</div>
  <div class="beat v">“What if the <em>same</em> policy could run in both places, and configuration decided where? That’s the next episode.”</div>

  <div class="beat k">Recap card</div>
  <div class="beat v">“Gateway = leverage, no context. Last mile = context, limited reach. Serious systems use both.”</div>
</div>

**Companion reading:** [Where policies live: the API gateway and the last mile](/concepts/04-policy-placement/)
