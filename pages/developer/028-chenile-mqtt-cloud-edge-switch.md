---
title: Chenile Cloud Edge Switch Guide
keywords: chenile cloud edge switch interceptor mqtt
tags: [developer chenile mqtt]
sidebar: developer
permalink: /developer-chenile-mqtt-cloud-edge-switch.html
summary: How to use cloud-edge-switch for cloud or edge mode switching
---

## Purpose

`cloud-edge-switch` is an interceptor-driven mechanism that can switch service behavior between cloud and edge modes.
It can route to local service references or remote/event-driven paths based on configuration.

## Add Dependency

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>cloud-edge-switch</artifactId>
</dependency>
```

## Usage Pattern

1. Include `cloud-edge-switch` and required messaging/proxy dependencies.
2. Attach switch behavior via `@CloudEdgeSwitchConfig` where needed.
3. Configure remote URL / switching configuration for target services.
4. Validate both modes (cloud and edge) in integration tests.

## Required Properties

`chenile.properties` pointer:

```properties
chenile.properties=org/chenile/cloudedgeswitch/test/TestCloudEdgeSwitch-chenile.properties
```

Core Chenile keys:

```properties
chenile.module.name=cloud-edge-switch
chenile.service.json.package=classpath*:org/chenile/core/service/*.json
chenile.event.json.package=classpath*:org/chenile/core/*.json
chenile.interceptors.path=org/chenile/core/chenile-core.xml
```

`application.yml` switch + transport keys:

```yaml
pubsub:
  enabled: true
  topic:
    separator: /
  mqtt:
    connection:
      ServerURIs: tcp://localhost:1883
    clientID: cloudMqtt
    enabled: false
    publish:
      topic: /chenile/mqtt

cloud:
  remoteUrl: localhost:8089
  cloudClientID: cloudMqtt
```

## Where It Hooks

- Works as Chenile interceptor in invocation path.
- Can switch service reference or publish through MQTT path depending on switch config.

## Common Pitfalls

- Missing switch config annotation/extensions on targeted operations.
- Remote URL configured but proxy/service registry wiring incomplete.
- Assuming synchronous local behavior while in edge async path.

## Related Docs

- [Chenile Messaging Developer Guide](/developer-chenile-mqtt.html)
- [Chenile MQTT Transport Guide](/developer-chenile-mqtt-transport.html)
