---
title: "Configuration management with cconfig"
order: 10
duration: "8–10 min"
summary: "cconfig gives each module its own JSON config, overridable down to a nested path at runtime, resolved per tenant, from pluggable sources behind one client."
---

**Episode goal:** show configuration handled the Chenile way — modular, path-level runtime overrides, per-tenant, source-agnostic — and demo a live override without a redeploy.

<div class="script">
  <div class="beat k">Cold open</div>
  <div class="beat v"><strong>On camera:</strong> “A service is logic, policies — and configuration. Most teams treat that third one as an afterthought. Chenile doesn’t. Meet <code>cconfig</code>.”</div>

  <div class="beat k">Module owns its config</div>
  <div class="beat v"><strong>On screen:</strong> open <code>ctest.json</code>. Voiceover: “Every module owns a JSON file named after it. A value can be a simple string or a deeply nested object. Config lives next to the module that owns it.”</div>

  <div class="beat k">The headline feature</div>
  <div class="beat v"><strong>Lower third:</strong> “Override any value — down to the path — at runtime.” Voiceover: “You’re not stuck replacing whole values.”</div>

  <div class="beat k">Demo — path overrides</div>
  <div class="beat v">Live: override <code>key1</code>; then override just <code>key2.abc</code> leaving the rest intact; then change <code>key2.fields.field1.range[1]</code> from 100 to 101; then <em>add</em> a whole new <code>field2</code> snippet. “No editing the base file. No redeploy.”</div>

  <div class="beat k">Per-tenant</div>
  <div class="beat v"><strong>Voiceover:</strong> “Overrides can apply to every request — or only when a <em>custom attribute</em> matches. In SaaS that’s the tenant ID. So one setting differs per tenant, resolved automatically, while the base config stays shared and clean.”</div>

  <div class="beat k">Demo — tenant switch</div>
  <div class="beat v">Send the same request with two different tenant IDs; show cconfig returning different effective values for the same key.</div>

  <div class="beat k">One client, many sources</div>
  <div class="beat v"><strong>On screen:</strong> the retrievers — Properties, JSON, Environment, Database (<code>cconfig-db</code>) — behind <code>CconfigClient</code>, with a memory cache in front. “Start with JSON files; later move overrides into a database for a live admin UI — without changing the code that reads config.”</div>

  <div class="beat k">Callback</div>
  <div class="beat v">“Same move as always: depend on the client interface, choose the source by configuration.”</div>

  <div class="beat k">Recap card</div>
  <div class="beat v">“cconfig = modular JSON config · path-level runtime overrides · per-tenant custom attribute · pluggable sources behind <code>CconfigClient</code>.”</div>
</div>

**Companion reading:** [Configuration management with cconfig](/concepts/08-configuration-management/)
