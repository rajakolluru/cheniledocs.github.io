---
title: Chenile Azure EventHub Guide
keywords: chenile azure eventhub pubsub
tags: [developer chenile mqtt azure]
sidebar: developer
permalink: /developer-chenile-mqtt-azure.html
summary: How to use chenile-azure transport module for Event Hubs
---

## Purpose

`chenile-azure` provides Azure Event Hubs publisher/subscriber integration for Chenile pub/sub.

## Add Dependency

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>chenile-azure</artifactId>
</dependency>
```

## Usage Pattern

1. Include `chenile-pub-sub` + `chenile-azure`.
2. Configure EventHub clients and mapping properties.
3. Publish/subscribe through Chenile abstractions.
4. Validate with integration tests for producer + consumer flow.

## Required Properties

`chenile.properties` pointer:

```properties
chenile.properties=org/chenile/pubsub/azure/TestKafka-chenile.properties
```

Core Chenile keys:

```properties
chenile.module.name=chenile-azure
chenile.service.json.package=classpath*:org/chenile/core/service/*.json
chenile.event.json.package=classpath*:org/chenile/core/*.json
chenile.interceptors.path=org/chenile/core/chenile-core.xml
```

`application.yml` Azure/EventHub keys:

```yaml
spring:
  chenile:
    azure:
      eventhubs:
        transport-type: AMQP_WEB_SOCKETS
        namespace: sb://localhost/;
        connection-string: "Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;"
        auto-start-consumers: false
        consumers:
          hubs:
            chenile:
              consumer-group: "eh1consumer"
        producers:
          - chenile
        clients:
          - acme
        client-prefix-separator: "-"
    storage:
      blob:
        endpoint: "http://localhost:10000/devstoreaccount1"
        container: "chenilequeue"
        credential-type: "key"
        account-name: "devstoreaccount1"
```

## Notes

- Module includes EventHub consumer starter and static mapping configuration helpers.
- Blob storage checkpoint configuration is used for robust consumption flows.

## Common Pitfalls

- Missing EventHub namespace/connection mapping.
- Checkpoint storage config not set for long-running consumers.
- Topic/event-hub naming mismatch between producer and subscriber.

## Related Docs

- [Chenile Messaging Developer Guide](/developer-chenile-mqtt.html)
- [Cloud Edge Switch Guide](/developer-chenile-mqtt-cloud-edge-switch.html)
