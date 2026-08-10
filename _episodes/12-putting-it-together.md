---
title: "Putting it together: a tour of a governed system"
order: 12
duration: "8–10 min"
summary: "The finale. Walk the layered architecture and the 11 repositories, and recap the five moves that make business logic pure and governance consistent."
---

**Episode goal:** zoom out. Connect the runtime model and the repository map to the story, and leave the viewer with a crisp mental model and a next step.

<div class="script">
  <div class="beat k">Cold open</div>
  <div class="beat v"><strong>On camera:</strong> “We started with a question — what are microservices for — and ended with a way to govern them. Let’s assemble the whole picture.”</div>

  <div class="beat k">The runtime</div>
  <div class="beat v"><strong>On screen:</strong> the recurring diagram, now complete — request → <code>ChenileExchange</code> → interception pipeline (your policies) → pure implementation → back out. Voiceover: “The same exchange-and-pipeline model runs in the gateway and in each service. That single fact is what let one policy abstraction serve both the edge and the last mile.”</div>

  <div class="beat k">The layers</div>
  <div class="beat v">Walk the layers: <code>chenile-parent</code> (versions) → <code>chenile-core</code> (runtime) → blueprints (<code>query-workflow</code>, <code>process-management</code>) → integration (<code>service-registry</code>, <code>proxies</code>, <code>security</code>, <code>messaging</code>) → testing/aux (<code>bdd</code>, <code>others</code>) → <code>cconfig</code>.</div>

  <div class="beat k">The 11 repos</div>
  <div class="beat v">Quick montage of the repository cards; pause on the four that carry the policy story: <code>chenile-core</code> (the pipeline), <code>chenile-security</code> (the gateway), <code>chenile-service-registry</code> (placement), <code>chenile-proxies</code>/<code>chenile-messaging</code> (reach beyond HTTP). “Eleven repos, one release train, currently v{{ site.maven_version }}.”</div>

  <div class="beat k">The five moves</div>
  <div class="beat v"><strong>Voiceover, brisk:</strong> “One: adopt services for deployability and ownership. Two: split definition from implementation. Three: turn horizontal concerns into policies. Four: place policies at the gateway <em>and</em> the last mile. Five: use one abstraction for both, with the registry choosing placement.”</div>

  <div class="beat k">And testing</div>
  <div class="beat v"><strong>Voiceover:</strong> “The same discipline covers testing. One Gherkin spec runs as a MockMvc unit test and a REST Assured integration test — behaviour written once, placement chosen by configuration.”</div>

  <div class="beat k">And messaging</div>
  <div class="beat v"><strong>Voiceover:</strong> “And events. Services depend on the <code>chenile-pub-sub</code> interface; MQTT, Kafka, Azure and in-JVM are swappable behind it — and every message runs the same pipeline, so the same policies apply.”</div>

  <div class="beat k">Config &amp; the client side</div>
  <div class="beat v"><strong>Voiceover:</strong> “Even configuration follows the pattern — <code>cconfig</code> gives modular, per-tenant, runtime overrides behind one client. And the interception idea reaches the client side: the proxy framework and service registry let you call any service through its interface, local or remote, with a client-side interceptor chain on the way out.”</div>

  <div class="beat k">The thesis</div>
  <div class="beat v"><strong>Lower third:</strong> “Business logic stays pure. Governance stays consistent. Placement is configuration — not a rewrite.”</div>

  <div class="beat k">Call to action</div>
  <div class="beat v">“Generate your first service — episode four shows every command — read the five-part story on the site, and star the repos. Links below.”</div>

  <div class="beat k">Recap card</div>
  <div class="beat v">“Chenile: separate what a service does from how it’s governed — everywhere it runs.”</div>
</div>

**Companion reading:** [Architecture](/architecture/) · [The 11 repositories](/repositories/) · [The five-part story](/concepts/)
