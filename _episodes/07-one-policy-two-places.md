---
title: "One policy, two places: Chenile in action"
order: 7
duration: "10–12 min"
summary: "The payoff. The same interceptor abstraction runs in Chenile's auth gateway and in each service's pipeline, with the service registry choosing placement."
---

**Episode goal:** demonstrate Chenile's unified policy model — write once, deploy at gateway and/or last mile via configuration — resolving the drift problem from episode six.

<div class="script">
  <div class="beat k">Cold open</div>
  <div class="beat v"><strong>On camera:</strong> “Last episode’s problem was drift — the same policy written twice, in two tech stacks. Chenile’s answer is almost annoyingly simple: there’s only <em>one</em> kind of policy.”</div>

  <div class="beat k">The idea</div>
  <div class="beat v"><strong>Voiceover:</strong> “A policy is a Chenile interceptor. The exact same interceptor contract runs inside the auth <em>gateway</em> from <code>chenile-security</code>, and inside every service’s interception pipeline at the <em>last mile</em>. You don’t write two versions. You write one, and choose where it runs.”</div>

  <div class="beat k">On screen</div>
  <div class="beat v">Two boxes — <em>Gateway</em> and <em>Last mile</em> — with the caption “same interceptor contract in both.” Arrows show the registry pushing a policy into either box.</div>

  <div class="beat k">Demo — last mile</div>
  <div class="beat v">Attach an authorization policy to a service via its service-registry entry (extension keys). Call the service directly; show it enforced at the last mile with full resource context.</div>

  <div class="beat k">Demo — gateway</div>
  <div class="beat v">Bring up the Chenile auth gateway (gateway starter). Configure authentication + a coarse check at the edge. Send an unauthenticated request; it’s rejected before reaching the service. “Same abstraction, different site.”</div>

  <div class="beat k">Demo — both</div>
  <div class="beat v">Now run both: authenticate at the edge, authorize the specific resource at the last mile. Send a request from a valid user for a resource they don’t own; edge lets it in, last mile blocks it. “Defence in depth, one policy model.”</div>

  <div class="beat k">Placement = config</div>
  <div class="beat v"><strong>Voiceover:</strong> “Moving a policy from last mile to gateway, or adding it in both, is a registry change — not a refactor. Placement is configuration.”</div>

  <div class="beat k">Beyond HTTP</div>
  <div class="beat v">Mention <code>chenile-proxies</code> (interface calls, local or remote) and <code>chenile-messaging</code> (MQTT, Kafka, Azure, in-JVM). “The same policy can guard an HTTP call, an internal proxy call, and a message off a queue.”</div>

  <div class="beat k">Key line</div>
  <div class="beat v"><strong>Lower third:</strong> “Write a policy once. Run it at the gateway, the last mile, or both — chosen by configuration.”</div>

  <div class="beat k">Recap card</div>
  <div class="beat v">“One interceptor abstraction, two deployment sites, placement by service-registry config. No drift.”</div>
</div>

**Companion reading:** [How Chenile implements policies at the gateway and the last mile](/concepts/05-how-chenile-helps/)
