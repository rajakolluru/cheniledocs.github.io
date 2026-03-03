---
title: Chenile Kafka Transport Guide
keywords: chenile kafka transport pubsub
tags: [developer chenile mqtt kafka]
sidebar: developer
permalink: /developer-chenile-mqtt-kafka.html
summary: How to use chenile-kafka transport module
---

## Purpose

`chenile-kafka` provides Kafka transport integration for Chenile pub/sub.
Use it when event traffic goes through Kafka topics.

## Add Dependency

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>chenile-kafka</artifactId>
</dependency>
```

## Usage Pattern

1. Include `chenile-pub-sub` + `chenile-kafka`.
2. Configure Kafka bootstrap and consumer/publisher properties.
3. Use Chenile event publication/subscription abstractions (`ChenilePub`, `@EventsSubscribedTo`).
4. Validate with integration tests using Kafka testcontainers.

## Required Properties

`chenile.properties` pointer:

```properties
chenile.properties=org/chenile/pubsub/kafka/TestKafka-chenile.properties
```

Core Chenile keys:

```properties
chenile.module.name=chenile-kafka
chenile.service.json.package=classpath*:org/chenile/core/service/*.json
chenile.event.json.package=classpath*:org/chenile/core/*.json
chenile.interceptors.path=org/chenile/core/chenile-core.xml
```

`application.yml` Kafka keys:

```yaml
spring:
  kafka:
    listener:
      missing-topics-fatal: false
    consumer:
      auto-offset-reset: earliest
      enable-auto-commit: true

pubsub:
  topic:
    separator: "_"
  clientID: someClient
  enabled: true
```

## Testing

`cucumber-mqtt-utils` includes `KafkaBaseTest` for dynamic `spring.kafka` property wiring.

## Common Pitfalls

- Using wrong bootstrap-server key across env profiles.
- Topic/key conventions not aligned with subscriber mapping.
- Not starting listener containers in test lifecycle.

## Related Docs

- [Chenile Messaging Developer Guide](/developer-chenile-mqtt.html)
- [Cucumber MQTT Utils Guide](/developer-chenile-mqtt-cucumber-utils.html)
