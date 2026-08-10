---
title: "The hidden tax: duplicated plumbing"
order: 2
duration: "6–8 min"
summary: "Why the tenth service feels worse than the first. Cross-cutting concerns, re-implemented service by service, are the real cost of microservices."
---

**Episode goal:** name the problem the rest of the series solves — horizontal concerns duplicated across services — so the viewer feels the pain before we offer the cure.

<div class="script">
  <div class="beat k">Cold open</div>
  <div class="beat v"><strong>On camera:</strong> “Your first microservice is a joy. Your tenth is a warning. Let’s talk about what changed.”</div>

  <div class="beat k">Setup</div>
  <div class="beat v"><strong>Voiceover:</strong> “Every service needs the same non-business things: knowing who’s calling, logging the same way, retrying safely, resolving the tenant, returning the same error shape. None of that is your product. All of it is <em>horizontal</em> — it cuts across every service.”</div>

  <div class="beat k">On screen</div>
  <div class="beat v">Two columns titled <em>Business logic</em> and <em>Everything else</em>. Drag items from a service into the right column: auth, logging, correlation IDs, retries, tenancy, validation, i18n, error envelope. The right column fills up; the left has one line.</div>

  <div class="beat k">The reveal</div>
  <div class="beat v"><strong>Voiceover:</strong> “Now copy that right-hand column into ten repositories, written ten slightly different ways, by ten people, over two years. That’s not architecture — that’s ten liabilities.”</div>

  <div class="beat k">Demo</div>
  <div class="beat v">Grep the same concept (say, reading the current user or building an error response) across several real service repos; show the near-duplicate-but-drifted implementations side by side.</div>

  <div class="beat k">Cost line</div>
  <div class="beat v"><strong>Lower third:</strong> “A security fix becomes a ten-repository pull request.” Beat. “That’s the tax.”</div>

  <div class="beat k">Reframe</div>
  <div class="beat v"><strong>Voiceover:</strong> “The cost of microservices is rarely the services. It’s the duplication of everything <em>around</em> them. Fixing that needs two ideas: a cleaner definition of what a service is, and a home for all the horizontal stuff.”</div>

  <div class="beat k">Cliffhanger</div>
  <div class="beat v">“Next: the first idea — a service is a contract, not a codebase.”</div>

  <div class="beat k">Recap card</div>
  <div class="beat v">“Microservices multiply the places where cross-cutting concerns get re-implemented. That duplication is the real cost.”</div>
</div>

**Companion reading:** [Why microservices — and what they really cost](/concepts/01-why-microservices/)
