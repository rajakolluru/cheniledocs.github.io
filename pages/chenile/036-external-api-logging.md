---
title: External API Logging
keywords: chenile external api logging pubsub inbound outbound third party technical
sidebar: chenile_sidebar
toc: true
permalink: /chenile-external-api-logging.html
folder: chenile
summary: Technical design for Chenile external API request and response logging
---

Chenile external API logging captures request and response records at third-party integration boundaries and publishes them through Chenile Pub/Sub when configured.

The feature is intentionally selective. Normal Chenile logging can continue for all requests, but external API Pub/Sub publication happens only when the request is explicitly marked external or when the outbound call uses Chenile's external client wrapper.

## External Boundaries

Chenile recognizes two external directions:

| Direction | Boundary | Trigger |
|-----------|----------|---------|
| Inbound | Third-party client calls a Chenile HTTP API | `@ExternalApi` on the Chenile controller class or operation method |
| Outbound | Chenile service calls a third-party HTTP server | `ChenileExternalClient.exchange(...)` |

Chenile proxy calls are not considered outbound external API calls. The proxy framework is for Chenile-to-Chenile communication and location transparency. Third-party HTTP calls should use `ChenileExternalClient`.

## Components

| Component | Module | Responsibility |
|-----------|--------|----------------|
| `@ExternalApi` | `chenile-core` | Marks an inbound controller or operation as third-party facing |
| `ExternalApiMetadata` | `chenile-core` | Reads external metadata from the current `ChenileExchange` |
| `LogOutput` | `chenile-core` | Builds inbound `LogRecord` and publishes external records when metadata exists |
| `ChenileExternalClient` | `chenile-core` | Wraps outbound third-party HTTP calls and captures request/response/error details |
| `ExternalApiLogSupport` | `chenile-core` | Applies common fields, masks headers, serializes and truncates payloads |
| `ExternalApiProperties` | `chenile-core` | Holds enabled flag, topics, payload size, and masked header settings |
| `ExternalApiPublisher` | `chenile-core` | Publisher extension point |
| `NoopExternalApiPublisher` | `chenile-core` | Default publisher when publication is disabled or not configured |
| `PubSubExternalApiPublisher` | `chenile-pub-sub` | Publishes serialized records to Chenile Pub/Sub topics |

## Configuration

Core properties:

```properties
chenile.external-api.logging.enabled=true
chenile.external-api.logging.publisher=pubsub
chenile.external-api.logging.inbound-topic=external.api.inbound
chenile.external-api.logging.outbound-topic=external.api.outbound
chenile.external-api.logging.max-payload-bytes=65536
chenile.external-api.logging.masked-headers=Authorization,x-Authorization
```

Configuration behavior:

| Property | Default | Meaning |
|----------|---------|---------|
| `enabled` | `true` | Enables capture and publish attempts |
| `publisher` | `none` | Selects no-op or Pub/Sub publisher |
| `inbound-topic` | empty | Topic used for inbound external records |
| `outbound-topic` | empty | Topic used for outbound external records |
| `max-payload-bytes` | `65536` | Payload truncation limit |
| `masked-headers` | `Authorization,x-Authorization` | Headers replaced with `****` |

Publisher selection:

1. Core creates `NoopExternalApiPublisher` when no other `ExternalApiPublisher` bean exists and `publisher=none` or the property is absent.
2. `chenile-pub-sub` creates `PubSubExternalApiPublisher` when `publisher=pubsub`, `ExternalApiProperties` exists, and the Pub/Sub module is loaded.
3. Applications can provide their own `ExternalApiPublisher` bean for custom destinations.

If a topic is blank, the Pub/Sub publisher returns without publishing. If `ChenilePub` is not available, it also returns without failing the request.

## Log Record Schema

External API records use `org.chenile.core.context.LogRecord`.

| Field | Description |
|-------|-------------|
| `direction` | `INBOUND` or `OUTBOUND` |
| `external` | Always `true` for external records |
| `externalSystem` | Third-party system or client name |
| `externalOperation` | External operation name |
| `serviceName` / `operationName` | Chenile service and operation for inbound requests |
| `protocol` | `HTTP` for outbound calls; inbound uses the entry point header |
| `target` | Outbound URL |
| `httpMethod` | Outbound HTTP method |
| `httpStatusCode` | HTTP response status when available |
| `durationMillis` | Execution time in milliseconds |
| `timestamp` | Record creation timestamp |
| `requestId` | `x-request-id` |
| `correlationId` | `x-correlation-id`, or request ID when absent |
| `requestPayload` | Serialized request payload after truncation |
| `responsePayload` | Serialized response payload after truncation |
| `errorCode` / `errorMessage` | Error metadata when available |
| `headers` | Headers with configured masking |

## Inbound Chain

Inbound external logging is part of the normal Chenile last-mile interceptor chain.

Sequence:

1. A third-party client invokes a Spring MVC controller.
2. The controller delegates to Chenile through `ControllerSupport.process(...)`.
3. Chenile builds `ChenileExchange` with service, operation, headers, body, and entry point metadata.
4. The configured core interceptors execute.
5. The target service method executes.
6. Response or exception information is stored on the exchange.
7. `LogOutput.doPostProcessing(...)` creates the normal `LogRecord`.
8. `LogOutput` checks `ExternalApiMetadata.from(exchange)`.
9. If no `@ExternalApi` metadata exists, no external Pub/Sub record is published.
10. If metadata exists and logging is enabled, `ExternalApiLogSupport` enriches the record.
11. `ExternalApiPublisher.publish(record)` is called.
12. Publication failures are caught and logged as warnings.
13. The HTTP response continues back to the caller.

Request and response capture:

| Point | Captured data |
|-------|---------------|
| Before service invocation | Start time is stored in an exchange header |
| After service invocation | Success flag, response, response messages, status, exception, duration |
| External enrichment | External system, external operation, request payload, response payload, request ID, correlation ID, masked headers |

## Outbound Chain

Outbound external logging is not in the inbound interceptor chain. It is captured inside `ChenileExternalClient`.

Sequence:

1. A Chenile service decides to call a third-party HTTP system.
2. The service builds `ExternalApiRequest`.
3. The service calls `ChenileExternalClient.exchange(request)`.
4. The client copies request headers and propagates `x-request-id` and `x-correlation-id` from `ContextContainer` when absent.
5. The client builds a base outbound `LogRecord`.
6. `RestTemplate.exchange(...)` sends the HTTP request.
7. On success, status, success flag, response payload, and duration are captured.
8. On `RestClientResponseException`, HTTP status, response body, error details, and duration are captured.
9. On other `RestClientException`, error details and duration are captured.
10. The record is published if logging is enabled.
11. The response body is converted to the requested response type, or the original exception is rethrown.

Request and response capture:

| Point | Captured data |
|-------|---------------|
| Before HTTP call | External system, operation, URL, method, request headers, request payload, request/correlation IDs |
| Successful response | HTTP status, success flag, response payload, duration |
| HTTP error response | HTTP status, error response payload, error message, duration |
| Client error | Error message and duration |

## Metadata Resolution

Inbound metadata comes from `@ExternalApi`.

Rules:

1. A class-level annotation applies to all operations in the controller.
2. A method-level annotation overrides class-level metadata.
3. `enabled=false` disables external metadata for that annotated element.
4. If `operation` is blank, Chenile uses the operation name from the exchange.

Outbound metadata comes from `ExternalApiRequest.system` and `ExternalApiRequest.operation`.

## Payload Handling

`ExternalApiLogSupport.payload(...)` serializes non-string payloads as JSON. If serialization fails, it falls back to `String.valueOf(payload)`.

Payloads are truncated using `chenile.external-api.logging.max-payload-bytes`. Truncated values are suffixed with `...[truncated]`.

Header values listed in `chenile.external-api.logging.masked-headers` are copied as `****`.

## Failure Behavior

External API logging is best effort.

| Failure | Behavior |
|---------|----------|
| Logging disabled | No external record is published |
| No `@ExternalApi` metadata on inbound request | No external record is published |
| No outbound topic or inbound topic | Pub/Sub publisher skips publication |
| No `ChenilePub` bean | Pub/Sub publisher skips publication |
| Publisher throws exception | Caller flow continues; warning is logged |
| Outbound third-party call fails | Record is captured, then the original `RestClientException` is rethrown |

## Duplicate Prevention

The framework prevents most duplicate records by making external logging opt-in:

1. Inbound records are published only for `@ExternalApi` services or operations.
2. Outbound records are published only through `ChenileExternalClient`.
3. Chenile proxy calls are not automatically classified as outbound external calls.

Operationally, keep separate inbound and outbound topics if consumers need independent processing.

## Developer Guide

For implementation examples and an end-to-end checklist, see [External API Logging Developer Guide](/developer-chenile-core-external-api-logging.html).
