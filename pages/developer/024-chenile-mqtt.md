---
title: Chenile Messaging Developer Guide
keywords: chenile mqtt kafka azure cloud edge switch developer
tags: [developer chenile mqtt]
sidebar: developer
permalink: /developer-chenile-mqtt.html
summary: Deep technical guide for chenile-mqtt modules and usage
---

## What Is Chenile Messaging

`chenile-mqtt` is the Chenile messaging stack for pub/sub style interactions across transports (MQTT, Kafka, Azure Event Hubs, JVM in-memory), plus edge/cloud switching patterns.

Repository path:

`/ajapro/chenile-mqtt`

## Module Map And When To Use Each

- `chenile-pub-sub`: Core pub/sub abstractions and initialization.
- `chenile-mqtt`: MQTT transport implementation (publisher/subscriber).
- `chenile-kafka`: Kafka transport implementation.
- `chenile-azure`: Azure Event Hubs transport implementation.
- `chenile-jvm-pub-sub`: In-JVM pub/sub for local/runtime use cases.
- `cloud-edge-switch`: Switch service behavior between cloud and edge modes.
- `cucumber-mqtt-utils`: Test utilities for MQTT/Kafka/EventHub integration tests.

Typical combinations:

- Base event-driven services: `chenile-pub-sub` + one transport module.
- Local-only integration/testing: `chenile-jvm-pub-sub`.
- Edge/cloud hybrid routing: add `cloud-edge-switch`.
- Integration tests with containers: add `cucumber-mqtt-utils` in test scope.

## Module Deep Dive

### chenile-pub-sub {#chenile-pub-sub}

Defines common pub/sub model and bootstrapping (`ChenilePub`, `ChenileSub`, topic initialization and entrypoint flow).

### chenile-mqtt {#chenile-mqtt-module}

Provides MQTT transport using Eclipse Paho client (`MqttPublisher`, `MqttSubscriber`).

### chenile-kafka {#chenile-kafka}

Provides Kafka transport and related consumer/publisher integrations for Chenile pub/sub.

### chenile-azure {#chenile-azure}

Provides Azure Event Hubs integration and subscriber/publisher setup.

### chenile-jvm-pub-sub {#chenile-jvm-pub-sub}

Provides in-memory JVM pub/sub components for same-process messaging.

### cloud-edge-switch {#cloud-edge-switch}

Interceptor-driven switching between cloud and edge processing modes.

### cucumber-mqtt-utils {#cucumber-mqtt-utils}

Test utilities for spinning brokers/containers and wiring dynamic test properties for messaging tests.

## Build And Versioning

- Version source: `chenile-messaging-version.txt`
- Current local value: `2.1.12`

Build:

```bash
cd /ajapro/chenile-mqtt
make build
```

Equivalent Maven command:

```bash
mvn -Drevision=$(cat chenile-messaging-version.txt) install
```

Useful targets:

- `make clean`
- `make javadoc`
- `make test-javadoc`
- `make prepare-deploy`
- `make deploy`

## Common Chenile Properties (Test Baseline)

Each transport test points `chenile.properties` to a module-specific file:

```properties
chenile.properties=org/chenile/<module>/Test<Module>-chenile.properties
```

Inside `*-chenile.properties`, the minimum Chenile runtime keys are:

```properties
chenile.base.url=
chenile.module.name=<module-name>
chenile.pre.processors=
chenile.post.processors=
chenile.service.json.package=classpath*:org/chenile/core/service/*.json
chenile.event.json.package=classpath*:org/chenile/core/*.json
chenile.interceptors.path=org/chenile/core/chenile-core.xml
```

## Specialized Guides

- [Chenile MQTT Transport Guide](/developer-chenile-mqtt-transport.html)
- [Chenile Kafka Transport Guide](/developer-chenile-mqtt-kafka.html)
- [Chenile Azure EventHub Guide](/developer-chenile-mqtt-azure.html)
- [Chenile JVM Pub Sub Guide](/developer-chenile-mqtt-jvm-pub-sub.html)
- [Cloud Edge Switch Guide](/developer-chenile-mqtt-cloud-edge-switch.html)
- [Cucumber MQTT Utils Guide](/developer-chenile-mqtt-cucumber-utils.html)

## Related Docs

- [Ajapro Framework Developer Guide](/developer-ajapro-framework-guide.html)
- [Chenile Core Developer Guide](/developer-chenile-core.html)
