---
title: "Your first Chenile service (live demo)"
order: 4
duration: "10–12 min"
summary: "Hands-on: generate an api + service pair and a deployable mini-monolith with jgen, build it, and call it. The definition/implementation split, made real."
---

**Episode goal:** convert theory into muscle memory. Viewer watches a service go from nothing to a running endpoint with **jgen**, and sees the two-module structure appear.

<div class="script">
  <div class="beat k">Cold open</div>
  <div class="beat v"><strong>On camera:</strong> “Enough theory. Let’s generate a real Chenile service with <em>jgen</em>, build it, and call it — and watch the definition/implementation split appear on disk.”</div>

  <div class="beat k">Prereqs</div>
  <div class="beat v"><strong>On screen checklist:</strong> Java 17+, Maven, git, a shell. “jgen is pure Java — no Node needed. If you have these, you’re ten minutes from a running service.” (Note on screen: the old <code>app-gen</code>/<code>gen.sh</code> is deprecated.)</div>

  <div class="beat k">Demo — install jgen</div>
  <div class="beat v">Terminal: <code>git clone …/chenile-gen</code>, <code>cd chenile-gen</code>, <code>make clean all</code>, then <code>source setpath.sh</code>. Narrate: “<code>make all</code> builds jgen and the CLI; <code>setpath.sh</code> puts <code>jgen</code> and <code>stm-cli</code> on the PATH. One-time setup.”</div>

  <div class="beat k">Demo — generate the service</div>
  <div class="beat v">Run <code>jgen</code> → pick the <code>chenile-service</code> blueprint. Service name <code>orders</code>; accept version/output defaults; <code>jpa: y</code>. “Answer a few prompts and jgen expands the blueprint.”</div>

  <div class="beat k">Payoff</div>
  <div class="beat v">Expand <code>output/orders/</code>: point at <code>orders-api</code> and <code>orders-service</code>. “There it is — the exact split from last episode, generated for you.”</div>

  <div class="beat k">Demo — the deployable</div>
  <div class="beat v">Run <code>jgen</code> again → <code>minimonolith</code> blueprint; name <code>ordersdeploy</code>; add <code>orders</code> under dependencies. “A service is a library; the mini-monolith hosts it.”</div>

  <div class="beat k">Demo — build</div>
  <div class="beat v"><code>cd output/orders &amp;&amp; make build</code>, then <code>cd ../ordersdeploy &amp;&amp; make build</code>. Narrate the api and service libraries building, then the deployable.</div>

  <div class="beat k">Demo — run &amp; call</div>
  <div class="beat v">Start the mini-monolith (<code>make run</code>); hit the generated endpoint with a curl script from <code>scripts/</code>. Show the response, then the health endpoint. “Business logic, a health probe, and an HTTP binding — and we wrote none of the plumbing.”</div>

  <div class="beat k">Point</div>
  <div class="beat v"><strong>Voiceover:</strong> “Look at the impl again — still just business logic. Everything else came from the framework. Next, we start adding the horizontal behavior as <em>policies</em>.”</div>

  <div class="beat k">Recap card</div>
  <div class="beat v">“Generated an <code>api</code> + <code>service</code> pair and a deployable monolith, built and called it — no plumbing written by hand.”</div>
</div>

**Companion reading:** [Get started](/get-started/) · [Definition vs. implementation](/concepts/02-definition-vs-implementation/)
