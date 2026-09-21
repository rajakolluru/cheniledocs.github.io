---
layout: doc
title: External API logging
description: Capture the requests and responses that cross a third-party boundary — inbound with @ExternalApi, outbound with ChenileExternalClient — and publish them for audit.
permalink: /developer/external-api-logging/
---

# External API logging

When a Chenile service talks to (or is called by) a **third party**, you usually want a durable record of what crossed the boundary. External API logging captures those requests and responses and publishes them — without you writing logging code at each call site.

<div class="callout"><div class="t">Not for Chenile-to-Chenile</div>
This is for <strong>third-party integrations only</strong>. Internal service-to-service calls go through <a href="/concepts/09-registry-and-proxies/">Chenile proxies</a> and are not the target of this feature.</div>

## The two directions

| Case | Meaning | What you do |
|---|---|---|
| **Inbound** external API | A third party calls an API this service exposes | Mark the controller/operation with `@ExternalApi` |
| **Outbound** external API | This service calls a third-party HTTP server | Use `ChenileExternalClient` |

## Enable it

Turn it on in `chenile.properties` (or the application config), choosing a publisher and topics:

```properties
chenile.external-api.logging.enabled=true
chenile.external-api.logging.publisher=pubsub
chenile.external-api.logging.inbound-topic=external.api.inbound
chenile.external-api.logging.outbound-topic=external.api.outbound
chenile.external-api.logging.max-payload-bytes=65536
chenile.external-api.logging.masked-headers=Authorization,x-Authorization
```

- **`publisher=none`** — core installs a `NoopExternalApiPublisher` that simply logs that publishing was skipped.
- **`publisher=pubsub`** — with `chenile-pub-sub` on the classpath, a `PubSubExternalApiPublisher` sends the serialized `LogRecord` to the inbound/outbound topic over your normal [messaging](/concepts/07-messaging-abstraction/) transport.
- **`max-payload-bytes`** caps how much body is captured; **`masked-headers`** redacts sensitive headers (e.g. `Authorization`) from the record.

## Mark the boundary

Annotate a controller (or a specific operation) that a third party calls:

```java
@RestController
@ChenileController(value = "partnerService", serviceName = "_partnerService_")
@ExternalApi                       // every operation here is external-facing
public class PartnerController extends ControllerSupport { … }
```

For outbound calls, route them through `ChenileExternalClient` so the request and response are captured the same way.

<div class="callout"><div class="t">Why publish, not just log</div>
Emitting a structured <code>LogRecord</code> to a topic means audit, compliance and analytics consumers can process external traffic independently — retained, searchable and separate from application logs. Where to look: <code>@ExternalApi</code>, <code>ChenileExternalClient</code>, <code>PubSubExternalApiPublisher</code> / <code>NoopExternalApiPublisher</code> in <code>chenile-core</code> and <code>chenile-pub-sub</code>.</div>
