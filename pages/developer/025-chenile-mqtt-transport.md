---
title: Chenile MQTT Transport Guide
keywords: chenile mqtt transport publisher subscriber
tags: [developer chenile mqtt]
sidebar: developer
permalink: /developer-chenile-mqtt-transport.html
summary: How to use chenile-mqtt transport module
---

## Purpose

`chenile-mqtt` implements Chenile pub/sub over MQTT using Eclipse Paho.
Use it when services publish/consume events via MQTT brokers.

## Add Dependency

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>chenile-mqtt</artifactId>
</dependency>
```

## Key Components

- `MqttPublisher`: publishes Chenile events to MQTT topics.
- `MqttSubscriber`: subscribes to configured topics and pushes to Chenile pub/sub entrypoint.

## Usage Pattern

1. Include `chenile-pub-sub` + `chenile-mqtt` dependencies.
2. Configure broker properties and topic conventions.
3. Define event subscriptions (`@EventsSubscribedTo`) in Chenile controllers/services.
4. Publish with `ChenilePub` abstraction; transport implementation handles MQTT delivery.

## Required Properties

`chenile.properties` pointer:

```properties
chenile.properties=org/chenile/mqtt/test/TestMqtt-chenile.properties
```

Core Chenile keys:

```properties
chenile.module.name=chenile-mqtt
chenile.service.json.package=classpath*:org/chenile/core/service/*.json
chenile.event.json.package=classpath*:org/chenile/core/*.json
chenile.interceptors.path=org/chenile/core/chenile-core.xml
```

`application.yml` transport keys:

```yaml
pubsub:
  topic:
    separator: /
  clientID: someClient
  enabled: true
  mqtt:
    connection:
      ServerURIs: tcp://localhost:1883
      keepAliveInterval: 120000
      userName: emqx_test
      password: emqx_test_password
      cleanStart: true
      receiveMaximum: 1000
      automaticReconnect: true
      session:
        expiry: 12000
    publish:
      topic: /chenile/mqtt
      qos: 2
      retain: false
```

## Test Pattern

Use `cucumber-mqtt-utils` `MqttBaseTest` for testcontainers-based broker setup.

## Common Pitfalls

- Topic naming mismatch between publisher and subscriber definitions.
- Broker connection settings not mapped in test/prod profiles.
- Assuming pub/sub init runs when `pubsub.enabled` is false.

## Related Docs

- [Chenile Messaging Developer Guide](/developer-chenile-mqtt.html)
- [Cucumber MQTT Utils Guide](/developer-chenile-mqtt-cucumber-utils.html)
