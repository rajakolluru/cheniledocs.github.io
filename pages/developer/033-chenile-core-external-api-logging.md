---
title: External API Logging Developer Guide
keywords: chenile external api logging pubsub inbound outbound third party developer
tags: [developer chenile core external-api logging]
sidebar: developer
permalink: /developer-chenile-core-external-api-logging.html
summary: How to mark inbound external APIs and call outbound third-party APIs with Chenile external API logging
---

## Purpose

Use external API logging when a Chenile service crosses a third-party boundary.

There are two supported cases:

| Case | Meaning | What the developer does |
|------|---------|-------------------------|
| Inbound external API | A third-party client calls an API exposed by this service | Mark the controller or operation with `@ExternalApi` |
| Outbound external API | This service calls a third-party HTTP server | Use `ChenileExternalClient` |

Do not use this for normal Chenile-to-Chenile proxy calls. Chenile proxies are internal service communication. External API logging is for third-party integrations.

## Enable Logging

Add the core logging properties in `chenile.properties` or the service application configuration:

```properties
chenile.external-api.logging.enabled=true
chenile.external-api.logging.publisher=pubsub
chenile.external-api.logging.inbound-topic=external.api.inbound
chenile.external-api.logging.outbound-topic=external.api.outbound
chenile.external-api.logging.max-payload-bytes=65536
chenile.external-api.logging.masked-headers=Authorization,x-Authorization
```

Publisher choices:

| Value | Behavior |
|-------|----------|
| `none` | Core creates `NoopExternalApiPublisher`. It logs that publishing was skipped. |
| `pubsub` | `chenile-pub-sub` creates `PubSubExternalApiPublisher` when that module is on the classpath. |

For Pub/Sub publication, include the Chenile Pub/Sub module and configure the normal Chenile Pub/Sub transport for the service. The external API publisher sends the serialized `LogRecord` to the inbound or outbound topic.

## Mark Inbound External APIs

Use `@ExternalApi` on the controller class when every operation in the controller is exposed to a third party:

```java
import org.chenile.core.annotation.ExternalApi;
import org.chenile.http.annotation.ChenileController;
import org.chenile.http.handler.ControllerSupport;
import org.springframework.web.bind.annotation.RestController;

@RestController
@ChenileController(value = "orderController", serviceName = "orderService")
@ExternalApi(system = "partner-portal")
public class OrderController extends ControllerSupport {
    // operations
}
```

Use `@ExternalApi` on a method when only that operation is external, or when you want a specific external operation name:

```java
@PostMapping("/orders")
@ExternalApi(system = "partner-portal", operation = "create-order")
public ResponseEntity<GenericResponse<Order>> createOrder(
        HttpServletRequest request, @RequestBody Order order) {
    return process("createOrder", request, order);
}
```

Annotation fields:

| Field | Required | Meaning |
|-------|----------|---------|
| `system` | Yes | Third-party client or partner system name |
| `operation` | No | External operation name. If empty, Chenile uses the operation name. |
| `enabled` | No | Set to `false` to disable a class-level external marker for a specific operation. |

Method-level annotations override class-level annotations.

## Create Outbound Third-Party Calls

Inject `ChenileExternalClient` into the service or gateway that calls the third-party HTTP system.

```java
import org.chenile.core.external.ChenileExternalClient;
import org.chenile.core.external.ExternalApiRequest;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;

@Service
public class PartnerOrderGateway {
    private final ChenileExternalClient externalClient;

    public PartnerOrderGateway(ChenileExternalClient externalClient) {
        this.externalClient = externalClient;
    }

    public PartnerResponse sendOrder(PartnerOrder order) {
        ExternalApiRequest<PartnerResponse> request = ExternalApiRequest.of(
                "partner-order-system",
                "send-order",
                "https://partner.example.com/orders",
                HttpMethod.POST,
                order,
                PartnerResponse.class);

        request.headers.put("x-partner-channel", "chenile");

        return externalClient.exchange(request);
    }
}
```

`ChenileExternalClient` uses `RestTemplate` internally and returns the converted response body. If the third-party server returns an HTTP error or the client fails, the original Spring `RestClientException` is rethrown after the external API log record is captured.

## End-to-End Checklist

1. Decide whether the interaction is really third-party inbound or third-party outbound.
2. For inbound, annotate only the third-party-facing controller or operation with `@ExternalApi`.
3. For outbound, use `ChenileExternalClient`; do not route the call through Chenile proxy.
4. Configure `chenile.external-api.logging.enabled=true`.
5. Use `publisher=pubsub` and provide inbound and outbound topics when records must go to Chenile Pub/Sub.
6. Configure masked headers for secrets.
7. Keep payload logging limits reasonable with `max-payload-bytes`.
8. Verify that normal business requests still succeed if Pub/Sub is unavailable.

## What Gets Published

Both inbound and outbound records use `org.chenile.core.context.LogRecord`.

Important fields:

| Field | Description |
|-------|-------------|
| `direction` | `INBOUND` or `OUTBOUND` |
| `external` | `true` |
| `externalSystem` | Third-party system name |
| `externalOperation` | External operation name |
| `requestPayload` | Serialized and truncated request payload |
| `responsePayload` | Serialized and truncated response payload |
| `httpStatusCode` | HTTP status when available |
| `durationMillis` | Measured execution duration |
| `requestId` | Request ID from headers/context |
| `correlationId` | Correlation ID, or request ID when correlation ID is absent |
| `errorCode` / `errorMessage` | Error details when available |
| `headers` | Header values with configured masking |

## Avoid Duplicate Records

Use these rules to avoid duplicate or noisy Pub/Sub records:

1. Mark only externally exposed APIs with `@ExternalApi`.
2. Do not mark internal controllers just because they are HTTP controllers.
3. Use `ChenileExternalClient` only for third-party outbound HTTP calls.
4. Use Chenile proxy for Chenile-to-Chenile service calls.
5. Keep inbound and outbound topics separate when consumers need different processing.

## Troubleshooting

If no Pub/Sub record appears:

1. Confirm `chenile.external-api.logging.enabled=true`.
2. Confirm `chenile.external-api.logging.publisher=pubsub`.
3. Confirm `chenile-pub-sub` is on the classpath.
4. Confirm `ChenilePub` is configured and available.
5. Confirm the inbound API has `@ExternalApi` or the outbound call uses `ChenileExternalClient`.
6. Confirm the correct topic is configured.

With `publisher=none`, the no-op publisher writes an info/debug log but does not publish to Pub/Sub.
