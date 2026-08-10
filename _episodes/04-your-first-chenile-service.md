---
title: "Your first Chenile service (live demo)"
order: 4
duration: "10–12 min"
summary: "Hands-on: generate an api + service pair and a deployable monolith with gen.sh, build it, and call it. The definition/implementation split, made real."
---

**Episode goal:** convert theory into muscle memory. Viewer watches a service go from nothing to a running endpoint, and sees the two-module structure appear.

<div class="script">
  <div class="beat k">Cold open</div>
  <div class="beat v"><strong>On camera:</strong> “Enough theory. Let’s generate a real Chenile service, build it, and call it — and watch the definition/implementation split appear on disk.”</div>

  <div class="beat k">Prereqs</div>
  <div class="beat v"><strong>On screen checklist:</strong> Node, GNU <code>make</code>, Maven, a shell. “If you have these, you’re ten minutes from a running service.”</div>

  <div class="beat k">Demo — setup</div>
  <div class="beat v">Terminal: clone <code>chenile-gen</code>, <code>cd app-gen</code>, run <code>make</code>, add <code>bin</code> to <code>PATH</code>. Narrate: “<code>make</code> compiles the generator and grabs Mustache. One-time setup.”</div>

  <div class="beat k">Demo — config</div>
  <div class="beat v">Run <code>gen.sh</code> → “create a local config”. Open <code>config/setenv.sh</code>; set company and org. “These become your Java package names — set them once.”</div>

  <div class="beat k">Demo — generate</div>
  <div class="beat v">Run <code>gen.sh</code> → “create a normal service and monolith”. Service name <code>stringdemo</code>; monolith <code>stringdemodeploy</code>; accept defaults. Two folders appear.</div>

  <div class="beat k">Payoff</div>
  <div class="beat v">Expand <code>stringdemo/</code>: point at <code>stringdemo-api</code> and <code>stringdemo-service</code>. “There it is — the exact split from last episode, generated for you.”</div>

  <div class="beat k">Demo — build</div>
  <div class="beat v"><code>cd output/stringdemo &amp;&amp; make build</code>, then <code>cd ../stringdemodeploy &amp;&amp; make build</code>. Narrate the api and service libraries building, then the deployable.</div>

  <div class="beat k">Demo — run &amp; call</div>
  <div class="beat v">Start the monolith; hit the generated endpoint with a curl script from <code>scripts/</code>. Show the response, then the health endpoint. “Business logic, a health probe, and an HTTP binding — and we wrote none of the plumbing.”</div>

  <div class="beat k">Point</div>
  <div class="beat v"><strong>Voiceover:</strong> “Look at the impl again — still just business logic. Everything else came from the framework. Next, we start adding the horizontal behavior as <em>policies</em>.”</div>

  <div class="beat k">Recap card</div>
  <div class="beat v">“Generated an <code>api</code> + <code>service</code> pair and a deployable monolith, built and called it — no plumbing written by hand.”</div>
</div>

**Companion reading:** [Get started](/get-started/) · [Definition vs. implementation](/concepts/02-definition-vs-implementation/)
