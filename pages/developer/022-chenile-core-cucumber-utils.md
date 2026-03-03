---
title: Chenile Core Cucumber Utils
keywords: chenile cucumber utils bdd spring mockmvc
tags: [developer chenile core testing]
sidebar: developer
permalink: /developer-chenile-core-cucumber-utils.html
summary: How to use cucumber-utils for Chenile REST and non-REST BDD tests
---

## Purpose

`cucumber-utils` provides reusable Cucumber step definitions and helper utilities for Chenile services.
It is mainly used with Spring `MockMvc` based API tests.

## Add Dependency (Test Scope)

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>cucumber-utils</artifactId>
  <scope>test</scope>
</dependency>
```

## Core Components

- `org.chenile.cucumber.rest.RestCukesSteps`: Generic REST Gherkin steps.
- `org.chenile.cucumber.nonrest.CukesSteps`: Generic non-REST steps.
- `org.chenile.cucumber.CukesContext`: Thread-local scenario context map.
- `org.chenile.cucumber.VariableHelper`: Cross-scenario variable substitution.
- `org.chenile.testutils.SpringMvcUtils`: Error/warning assertions for `GenericResponse`.

## Test Runner Setup

Use a Cucumber runner with glue to your local steps + chenile rest steps:

```java
@RunWith(Cucumber.class)
@CucumberOptions(
  features = "src/test/resources/features",
  glue = {
    "classpath:com/mycompany/app/bdd",
    "classpath:org/chenile/cucumber/rest"
  },
  plugin = {"pretty"}
)
public class CukesRestTest {}
```

## Spring Test Bootstrapping

Create a glue class to load Spring + MockMvc:

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, classes = SpringConfig.class)
@AutoConfigureMockMvc
@CucumberContextConfiguration
@ActiveProfiles("unittest")
public class CukesSteps {
  @Given("dummy")
  public void dummy() {}
}
```

## Common Gherkin Patterns

Request construction and invocation:

```gherkin
Given dummy
When I construct a REST request with header "x-chenile-tenant-id" and value "tenant1"
And I POST a REST request to URL "/s1/op1" with payload
"""
{"id":"A1"}
"""
Then the http status code is 200
And success is true
```

Response assertions:

```gherkin
And the REST response key "id" is "A1"
And the REST response key "items" collection has an item with keys and values:
  | key  | value |
  | name | foo   |
```

Variable capture and reuse:

```gherkin
Then store "$.payload.id" from response to "savedId"
When I GET a REST request to URL "/entity/${savedId}"
```

## Error/Warning Assertions

`RestCukesSteps` includes steps for:

- expected HTTP status
- application error codes/subError codes
- warning assertions
- top-level description and structured error checks

Use these to standardize API failure contract tests.

## Good Practices

- Keep local glue small; reuse `org/chenile/cucumber/rest` heavily.
- Use `VariableHelper` for inter-step values instead of custom globals.
- Keep one `dummy` hook class per test module for spring context setup.
- Maintain feature files close to business behavior, not implementation.

## Related Docs

- [Chenile Core Developer Guide](/developer-chenile-core.html)
- [Multi Datasource Utils Guide](/developer-chenile-core-multi-datasource-utils.html)
