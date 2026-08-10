---
title: "Messaging: one interface, many transports"
short: "Messaging abstraction"
order: 7
summary: "chenile-messaging applies the same discipline to events. Services depend on a small messaging interface; MQTT, Kafka, Azure and in-JVM are swappable implementations behind it — and every message runs the same pipeline as an HTTP call."
---

## The same idea, now for events

The through-line of this whole story is one move repeated: **separate the interface from the implementation, and decide the rest by configuration.** We did it for [services](/concepts/02-definition-vs-implementation/), for [policies](/concepts/05-how-chenile-helps/), and for [tests](/concepts/06-bdd-testing/). `chenile-messaging` does it for **messaging**.

A service that publishes or consumes events should not know — or care — whether the bytes travel over MQTT, Kafka, an Azure service, or never leave the JVM. It should depend on a **messaging interface**. The broker is an implementation detail chosen at deployment time.

<div class="callout key">
  <div class="t">The move</div>
  Your code depends on the <code>chenile-pub-sub</code> interface. The transport — MQTT, Kafka, Azure, in-JVM — is a swappable implementation selected by configuration. Change the broker without changing a line of business code.
</div>

<p style="text-align:center;margin:2em 0"><img src="/assets/img/chenile-messaging.svg" alt="One ChenilePub/ChenileSub interface with MQTT, Kafka, Azure and in-JVM implementations, all feeding the same interception pipeline"></p>

## The interface — `chenile-pub-sub`

The abstraction is deliberately tiny. Publishing is one interface:

```java
public interface ChenilePub {
    void publish(String topic, String payload, Map<String,Object> properties);
    void asyncPublish(String topic, String payload, Map<String,Object> properties);
    // publish addressed to a service operation, resolved via the service registry
    void publishToOperation(String service, String operationName,
                            String payload, Map<String,Object> properties);
}
```

Consuming is another:

```java
public interface ChenileSub {
    void messageArrived(String topic, String message, Map<String,Object> headers);
}
```

That is the entire contract a service sees. Notice `publishToOperation` — publishing can be addressed to a **service operation** rather than a raw topic, with the binding resolved through the service registry (the same registry that carries a service's policies). Messaging is a first-class entry point, not a side channel.

## The implementations — pick your transport

Each transport is a separate module that **implements** the same interface. Nothing in your service changes when you swap one for another:

<div class="grid-2" style="margin:1.4em 0">
  <div class="card">
    <div class="ic">📡</div>
    <h3><code>chenile-mqtt</code></h3>
    <p><code>MqttPublisher</code> / <code>MqttSubscriber</code> — MQTT brokers, ideal for IoT and edge fan-out. Also used internally by the cloud-edge switch.</p>
  </div>
  <div class="card">
    <div class="ic">🟧</div>
    <h3><code>chenile-kafka</code></h3>
    <p><code>KafkaPublisher</code> — high-throughput, durable event streaming for backbone pipelines.</p>
  </div>
  <div class="card">
    <div class="ic">☁️</div>
    <h3><code>chenile-azure</code></h3>
    <p><code>AzurePublisher</code> — managed Azure messaging for cloud-native deployments.</p>
  </div>
  <div class="card">
    <div class="ic">⚙️</div>
    <h3><code>chenile-jvm-pub-sub</code></h3>
    <p><code>JvmPublisher</code> — an in-process implementation of the <em>same</em> interface. Pub/sub with no broker at all — perfect for a modulith, for tests, or for early stages before you externalize the bus.</p>
  </div>
</div>

The in-JVM implementation is the clearest proof that the abstraction is real: the identical publishing code runs against a Kafka cluster or entirely inside one process, decided by which module you deploy.

## Why this complements the rest of Chenile

The payoff is bigger than transport portability. Because `chenile-core` normalizes **every** trigger into a `ChenileExchange` and runs it through the **same interception pipeline**, an inbound message is processed exactly like an HTTP request:

- The same **service policies** apply — security, multi-tenancy, i18n, logging, idempotency ([part 3](/concepts/03-service-policies/)). You don't write a second authorization path for events.
- The same **service implementation** can be reached by REST, by an in-process [proxy](/repositories/), or by a message — without rewriting it. A Chenile service is, in effect, protocol-agnostic; Chenile acts as an in-VM message bus that also speaks HTTP.
- **`cloud-edge-switch`** builds on this to route the same messages between edge devices and a cloud broker, so an event can originate at the edge and be handled centrally with identical logic.

<div class="callout">
  <div class="t">In one line</div>
  Messaging in Chenile is not a bolt-on. It's the same architecture — interface over implementation, one pipeline for every entry point — extended from request/response to events. Choose your broker in configuration; keep your business logic and your policies exactly as they are.
</div>

<div class="callout">
  <div class="t">Where to look</div>
  Interface: <code>org.chenile.pubsub.ChenilePub</code> and <code>ChenileSub</code> in <code>chenile-pub-sub</code>. Implementations: <code>chenile-mqtt</code>, <code>chenile-kafka</code>, <code>chenile-azure</code>, <code>chenile-jvm-pub-sub</code>. Routing: <code>cloud-edge-switch</code>. All ship in the <code>chenile-messaging</code> repository.
</div>
