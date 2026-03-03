---
title: Chenile JVM Pub Sub Guide
keywords: chenile jvm pub sub in memory messaging
tags: [developer chenile messaging]
sidebar: developer
permalink: /developer-chenile-mqtt-jvm-pub-sub.html
summary: How to use chenile-jvm-pub-sub for in-process event messaging
---

## Purpose

`chenile-jvm-pub-sub` provides in-process pub/sub messaging.
Use it when publisher and subscriber are in the same JVM and you want Chenile event flow without external broker infrastructure.

## When To Use

- Local development and fast feedback loops.
- Unit/integration tests where external MQTT/Kafka is unnecessary.
- Low-latency in-process event routing.

## Add Dependency

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>chenile-jvm-pub-sub</artifactId>
</dependency>
```

## Required Properties

`chenile.properties` pointer:

```properties
chenile.properties=org/chenile/pubsub/jvm/TestJVM-chenile.properties
```

Core Chenile keys:

```properties
chenile.module.name=chenile-jvm-pub-sub
chenile.service.json.package=classpath*:org/chenile/core/service/*.json
chenile.event.json.package=classpath*:org/chenile/core/*.json
chenile.interceptors.path=org/chenile/core/chenile-core.xml
```

`application.yml` baseline:

```yaml
pubsub:
  topic:
    separator: "_"
  enabled: true

mqtt:
  publish:
    base:
      topic: chenile
  subscribe:
    base:
      topic: chenile
```

## How It Works

- `JvmPublisher` implements `ChenilePub`.
- `publish(...)` is synchronous and dispatches immediately to subscriber.
- `asyncPublish(...)` stores message and uses executor to dispatch asynchronously.
- `JvmSubscriber` forwards messages to Chenile `EventProcessor`.
- Tenant header (`x-chenile-tenant-id`) is applied to `ContextContainer` during processing.

## Basic Usage Pattern

1. Define subscriptions using Chenile patterns (`@EventsSubscribedTo`, event mappings).
2. Inject/use `ChenilePub` in publisher service.
3. Publish event payload and optional headers.
4. Subscriber handler receives event through Chenile event processor.

Example publish:

```java
Map<String, Object> headers = new HashMap<>();
headers.put("x-chenile-tenant-id", "tenant1");
chenilePub.publish("orders_created", jsonPayload, headers);
```

Async publish:

```java
chenilePub.asyncPublish("orders_created", jsonPayload, headers);
```

## Notes On Semantics

- Since this is in-process transport, failures and retries follow application runtime behavior, not broker durability.
- Prefer external transport modules for cross-process durability and independent scaling.
- Useful as a functional stepping stone before switching to MQTT/Kafka/Azure.

## Related Docs

- [Chenile Messaging Developer Guide](/developer-chenile-mqtt.html)
- [Chenile MQTT Transport Guide](/developer-chenile-mqtt-transport.html)
- [Chenile Kafka Transport Guide](/developer-chenile-mqtt-kafka.html)
