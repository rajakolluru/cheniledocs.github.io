---
layout: doc
title: Messaging transports
description: Configure the concrete transports behind Chenile's pub/sub interface — MQTT, Kafka, Azure Event Hubs, in-JVM — plus the cloud-edge switch and test utilities.
permalink: /developer/messaging-transports/
---

# Messaging transports

[Chenile messaging](/concepts/07-messaging-abstraction/) is one interface (`ChenilePub` / `ChenileSub`) with swappable implementations. This guide covers configuring each concrete transport. In every case you depend on **`chenile-pub-sub` + one transport module**, and publish/subscribe through the same abstractions (`ChenilePub`, `@EventsSubscribedTo`).

## Choosing modules

| Module | Use when |
|---|---|
| `chenile-mqtt` | MQTT brokers (IoT, edge fan-out) — Eclipse Paho `MqttPublisher` / `MqttSubscriber` |
| `chenile-kafka` | High-throughput, durable event streaming over Kafka topics |
| `chenile-azure` | Azure Event Hubs |
| `chenile-jvm-pub-sub` | Local/in-process pub/sub — no broker (tests, moduliths) |
| `cloud-edge-switch` | Hybrid edge/cloud routing between local and remote/event paths |
| `cucumber-mqtt-utils` | BDD integration tests against MQTT / Kafka / Event Hubs (test scope, testcontainers) |

Typical combos: **base event-driven** = `chenile-pub-sub` + one transport; **local/testing** = `chenile-jvm-pub-sub`; **edge/cloud hybrid** = add `cloud-edge-switch`.

## MQTT

```xml
<dependency><groupId>org.chenile</groupId><artifactId>chenile-mqtt</artifactId></dependency>
```

Provides the MQTT transport via the Eclipse Paho client. Configure the broker connection and point `chenile.properties` at the service's MQTT config; publish with `ChenilePub` and consume with `@EventsSubscribedTo`. Ideal for IoT/edge topologies, and used internally by the cloud-edge switch.

## Kafka

```xml
<dependency><groupId>org.chenile</groupId><artifactId>chenile-kafka</artifactId></dependency>
```

1. Include `chenile-pub-sub` + `chenile-kafka`.
2. Configure Kafka bootstrap and consumer/publisher properties.
3. Use `ChenilePub` / `@EventsSubscribedTo` — no Kafka client code.
4. Validate with Kafka testcontainers.

## Azure Event Hubs

```xml
<dependency><groupId>org.chenile</groupId><artifactId>chenile-azure</artifactId></dependency>
```

Beyond basic delivery, `chenile-azure` (as of [2.1.30](/release-notes/2.1.30/)) supports **per-message partition routing** and **logical-topic handlers**.

**Partition routing** — set one property on the `asyncPublish` call:

| Message property | Result |
|---|---|
| *(none)* | Partition `0` (previous behavior) |
| `chenile.azure.partition-id: 2` | A specific physical partition |
| `chenile.azure.partition-key: customer-123` | Azure hashes the key — preserves order per key |
| `chenile.azure.partition-mode: auto` | No selector — Azure distributes independent messages |

Only one mode may be chosen; `partition-id`/`partition-key`/`auto` cannot be combined, and an invalid explicit id falls back to partition `0`. Use a **partition key for per-aggregate ordering** and **`auto` for throughput**.

**Logical-topic handlers** — register a transport-neutral `ChenileMessageHandler` for a logical topic. Azure dispatches to exactly one matching handler before the legacy `EventProcessor` path; if none matches, the processor handles it. More than one match is an error, and handlers must be **idempotent** (delivery can be retried before checkpoint commit). See the [Azure configuration guide](https://github.com/ajapros/chenile-mqtt/blob/main/chenile-azure/docs/configuration-guide.md) for routing examples and tenant Event-Hub naming.

## In-JVM

```xml
<dependency><groupId>org.chenile</groupId><artifactId>chenile-jvm-pub-sub</artifactId></dependency>
```

The same `ChenilePub` interface, implemented entirely in-process (`JvmPublisher`) — no broker. Perfect for moduliths, tests, and early stages before you externalize the bus.

## Cloud-edge switch

```xml
<dependency><groupId>org.chenile</groupId><artifactId>cloud-edge-switch</artifactId></dependency>
```

An interceptor-driven mechanism that switches a service between **cloud** and **edge** modes — routing to a local service reference or to a remote/event-driven path based on configuration. Attach it with `@CloudEdgeSwitchConfig`, configure the remote URL / switching rules, and validate both modes. It lets an event originate at the edge and be handled centrally (or vice-versa) with the same code.

<div class="callout key"><div class="t">The through-line</div>
Whichever transport you pick, services publish and subscribe through the same interface, and every inbound message runs the same <a href="/concepts/10-owiz/">interception pipeline</a> as an HTTP call — so security, tenancy and logging policies apply uniformly across REST, MQTT, Kafka, Azure and in-JVM.</div>
