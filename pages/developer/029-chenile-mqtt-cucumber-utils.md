---
title: Cucumber MQTT Utils Guide
keywords: chenile cucumber mqtt kafka testcontainers
tags: [developer chenile mqtt testing]
sidebar: developer
permalink: /developer-chenile-mqtt-cucumber-utils.html
summary: How to use cucumber-mqtt-utils for messaging integration tests
---

## Purpose

`cucumber-mqtt-utils` extends Chenile cucumber utilities for messaging integration tests.
It includes reusable test base classes for MQTT and Kafka broker startup with testcontainers.

## Add Dependency (Test Scope)

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>cucumber-mqtt-utils</artifactId>
  <scope>test</scope>
</dependency>
```

## Key Utilities

- `org.chenile.mqtt.test.MqttBaseTest`: starts MQTT broker container and injects dynamic properties.
- `org.chenile.mqtt.test.KafkaBaseTest`: starts Kafka container and injects dynamic properties.

## Required Properties

`MqttBaseTest` injects:

```properties
pubsub.mqtt.connection.ServerURIs=tcp://<container-host>:<container-port>
```

`KafkaBaseTest` sets/injects bootstrap values:

```properties
spring.kafka.bootstrap-servers=<container-host>:<container-port>
spring.kafka.bootstrap-server=<container-host>:<container-port>
```

Use an `application.yml` baseline like:

```yaml
pubsub:
  enabled: true
  topic:
    separator: "_"

spring:
  kafka:
    consumer:
      auto-offset-reset: earliest
      enable-auto-commit: true
```

## Typical Test Setup

1. Create Spring test config for service under test.
2. Extend appropriate base test (`MqttBaseTest` / `KafkaBaseTest`) in integration tests.
3. Use Cucumber runner + glue (`org/chenile/cucumber/rest`) for REST-triggered event flows.
4. Assert consumed/published message outcomes.

## Why Use It

- Removes boilerplate container wiring in each module.
- Keeps broker endpoint properties synchronized via dynamic property registry.
- Works with Chenile REST + event hybrid test scenarios.

## Common Pitfalls

- Running tests without Docker/testcontainers support.
- Declaring broker props manually that conflict with dynamic injected props.
- Forgetting teardown semantics when writing custom container helpers.

## Related Docs

- [Chenile Messaging Developer Guide](/developer-chenile-mqtt.html)
- [Chenile Kafka Transport Guide](/developer-chenile-mqtt-kafka.html)
