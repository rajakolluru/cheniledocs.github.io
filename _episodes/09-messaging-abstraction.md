---
title: "Messaging: one interface, many transports"
order: 9
duration: "9–11 min"
summary: "chenile-messaging applies the whole series' move to events — a tiny ChenilePub/ChenileSub interface with MQTT, Kafka, Azure and in-JVM implementations, all feeding the same pipeline."
---

**Episode goal:** show that messaging in Chenile is the same architecture — interface over implementation, one pipeline for every entry point — extended from request/response to events. Demo swapping a transport without touching business code.

<div class="script">
  <div class="beat k">Cold open</div>
  <div class="beat v"><strong>On camera:</strong> “We’ve separated interface from implementation for services, policies and tests. Last stop: messaging. Your code should not know whether an event rides MQTT, Kafka, Azure — or never leaves the JVM.”</div>

  <div class="beat k">The interface</div>
  <div class="beat v"><strong>On screen:</strong> open <code>ChenilePub</code> and <code>ChenileSub</code> in <code>chenile-pub-sub</code>. Voiceover: “This is the entire contract a service sees — <code>publish</code>, <code>asyncPublish</code>, <code>publishToOperation</code>, and <code>messageArrived</code>. No broker types anywhere.”</div>

  <div class="beat k">publishToOperation</div>
  <div class="beat v">Point at <code>publishToOperation(service, operationName, …)</code>. “Publishing can target a service operation, resolved through the same service registry that carries a service’s policies. Messaging is a first-class entry point, not a side channel.”</div>

  <div class="beat k">Lower third</div>
  <div class="beat v">“One interface. Four implementations.” Show the diagram: the interface bar fanning out to MQTT, Kafka, Azure, in-JVM.</div>

  <div class="beat k">Demo — swap the transport</div>
  <div class="beat v">Run a publisher wired to <strong>chenile-jvm-pub-sub</strong> (no broker) — messages flow in-process. Then change configuration/dependency to <strong>chenile-mqtt</strong> or <strong>chenile-kafka</strong> and re-run the <em>same</em> service code against a real broker. “Not one line of business code changed. That’s the abstraction being real.”</div>

  <div class="beat k">The key insight</div>
  <div class="beat v"><strong>Voiceover:</strong> “Here’s why this matters beyond portability. An inbound message is normalized into a <code>ChenileExchange</code> and run through the <em>same</em> interception pipeline as an HTTP call. So your security, tenancy, i18n and logging policies apply to events automatically — you never write a second authorization path.”</div>

  <div class="beat k">On screen</div>
  <div class="beat v">Animate: message → ChenileExchange → interception pipeline (policies) → the same service operation an HTTP request would hit.</div>

  <div class="beat k">Cloud-edge</div>
  <div class="beat v">Briefly show <code>cloud-edge-switch</code>: “The same messages route between edge devices and a cloud broker — event originates at the edge, handled centrally with identical logic.”</div>

  <div class="beat k">Callback</div>
  <div class="beat v">“Same philosophy as everything else: depend on the interface, choose the implementation by configuration. Chenile is an in-VM message bus that also speaks HTTP.”</div>

  <div class="beat k">Recap card</div>
  <div class="beat v">“Messaging = <code>chenile-pub-sub</code> interface + swappable transports (mqtt/kafka/azure/jvm). Every message runs the same pipeline, so policies just work.”</div>
</div>

**Companion reading:** [Messaging: one interface, many transports](/concepts/07-messaging-abstraction/)
