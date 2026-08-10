---
title: "What are microservices actually for?"
order: 1
duration: "6–8 min"
summary: "Reset the conversation: microservices are a means, not a goal. The five properties we really want — and why a modulith counts too."
---

**Episode goal:** get the viewer to stop equating "microservices" with "many small processes" and start thinking about the *properties* they actually want. Sets up the entire series.

<div class="script">
  <div class="beat k">Cold open</div>
  <div class="beat v"><strong>[Brand sting, 5s.]</strong> On camera: “Most microservices talks start with how. This series starts with <em>why</em> — because if we get the why wrong, every framework we pick makes it worse.”</div>

  <div class="beat k">Hook</div>
  <div class="beat v"><strong>Voiceover:</strong> “Nobody wants microservices. What people want is to ship a change to <em>one</em> part of the system without re-testing the whole thing. Microservices are just one way to get there.”</div>

  <div class="beat k">On screen</div>
  <div class="beat v">Build a list, one line at a time, as each is named: <em>Independent deployability · Clear ownership · Blast-radius control · Independent scaling · Technology freedom.</em></div>

  <div class="beat k">Voiceover</div>
  <div class="beat v">Walk each property with a one-sentence real example. Deployability: “pricing ships without releasing checkout.” Ownership: “a small team owns the service, its data, and its pager.” Blast radius: “when inventory gets slow, the cart doesn’t die with it.”</div>

  <div class="beat k">Turn</div>
  <div class="beat v"><strong>Voiceover:</strong> “Notice none of these say ‘lots of processes.’ You can get most of them from a well-partitioned <em>modulith</em> — one deployable, clean internal service boundaries. Chenile supports both, and lets you split later without rewriting logic.”</div>

  <div class="beat k">Demo (optional)</div>
  <div class="beat v">Show a repo tree with several service modules living in one deployable, then the same modules assembled into separate deployables. Same code, two topologies.</div>

  <div class="beat k">Key line</div>
  <div class="beat v"><strong>Lower third:</strong> “The unit that matters is the <em>service</em> — a contract with an owner. Microservices are a deployment choice.”</div>

  <div class="beat k">Cliffhanger</div>
  <div class="beat v"><strong>Voiceover:</strong> “So if services are so great — why does the tenth one always feel worse than the first? Next episode: the tax nobody budgets for.”</div>

  <div class="beat k">Recap card</div>
  <div class="beat v">“Microservices are a means to deployability, ownership and blast-radius control — not a goal.” Link: chenile — Why microservices.</div>
</div>

**Companion reading:** [Why microservices — and what they really cost](/concepts/01-why-microservices/)
