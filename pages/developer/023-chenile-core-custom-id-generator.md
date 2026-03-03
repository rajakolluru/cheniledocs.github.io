---
title: Chenile Core Custom ID Generator
keywords: chenile custom id generator jpa id strategy
tags: [developer chenile core jpa]
sidebar: developer
permalink: /developer-chenile-core-custom-id-generator.html
summary: How to use and customize Chenile ID generation strategy
---

## Purpose

Chenile `IDGenerator` provides deterministic or custom pluggable entity ID generation.
It is used by `BaseJpaEntity` during `@PrePersist/@PreUpdate` when `id` is null.

Default behavior:

- Format: `<prefix>-<requestId>-<counter>`
- `prefix` usually comes from entity class name (`getPrefix()`).
- `requestId` comes from `ContextContainer`.
- If requestId is missing, UUID is used.

## Where It Is Used

`jpa-utils` `BaseJpaEntity` calls:

```java
setId(IDGenerator.generateID(getPrefix()));
```

So custom strategies automatically apply to entities extending `BaseJpaEntity`.

## Strategy Selection Order

`IDGenerator` chooses strategy in this order:

1. `ContextContainer` extension key `__ID_GENERATOR_STRATEGY__`
2. context/header value `idGeneratorStrategy`
3. JVM system property `chenile.id.generator.strategy`
4. configured default strategy (`default` unless overridden)

## Step 1: Implement Custom Strategy

```java
@Bean("customStrategy")
IDGenerator.IdGenerationStrategy customStrategy() {
  return (prefix, contextContainer) -> "CUSTOM-" + prefix;
}
```

## Step 2: Register Strategies Automatically

`IdGeneratorConfiguration` auto-registers all Spring beans of type `IDGenerator.IdGenerationStrategy`.
So just exposing strategy as a Spring bean is enough.

## Step 3: Set Default Strategy (Optional)

```properties
chenile.id.generator.defaultStrategy=customStrategy
```

## Step 4: Choose Strategy Per Request (Optional)

Per-request override:

```java
ContextContainer.putExtension(IDGenerator.STRATEGY_KEY, "customStrategy");
```

You can also set strategy via:

- `idGeneratorStrategy` value in context/header map
- JVM prop: `-Dchenile.id.generator.strategy=customStrategy`

## Example: Entity With BaseJpaEntity

```java
@Entity
public class OrderEntity extends BaseJpaEntity {
  @Override
  protected String getPrefix() {
    return "Order";
  }
}
```

If `id` is null at persist time, Chenile generates ID using active strategy.

## Testing Custom Strategy

Pattern used in Chenile tests:

```java
ContextContainer.CONTEXT_CONTAINER.setRequestId("REQ1");
ContextContainer.putExtension(IDGenerator.STRATEGY_KEY, "customStrategy");
String id = IDGenerator.generateID("Order");
assertEquals("CUSTOM-Order", id);
```

Fallback check:

```java
ContextContainer.putExtension(IDGenerator.STRATEGY_KEY, "missingStrategy");
String id = IDGenerator.generateID("Order");
assertTrue(id.startsWith("Order-REQ1-"));
```

## Common Pitfalls

- Strategy bean name mismatch with configured strategy name.
- Forgetting to clear context extension after tests.
- Relying on requestId without ensuring it is populated in context.
- Expecting custom strategy in entities not extending `BaseJpaEntity`.

## Related Docs

- [Chenile Core Developer Guide](/developer-chenile-core.html)
- [Multi Datasource Utils Guide](/developer-chenile-core-multi-datasource-utils.html)
