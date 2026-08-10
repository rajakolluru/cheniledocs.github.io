---
title: "Test once, run everywhere: BDD across unit and integration"
short: "BDD testing"
order: 6
summary: "Chenile ships a Gherkin vocabulary implemented twice — over Spring MockMvc for in-process unit tests and over REST Assured for integration tests. The same .feature file drives both."
---

## The behaviour is the spec — so write it once

Chenile treats a service's behaviour as an executable specification written in **Gherkin** (Cucumber). A scenario reads like a description of what the service does:

```gherkin
Feature: Tests the s1 service using a REST client.

  Scenario: op1 stamps the entity id
    When I POST a REST request to URL "/s1/op1" with payload
    """
    { }
    """
    Then the REST response key "id" is "S1ServiceImpl"
```

The important idea is that this `.feature` file describes **behaviour, not mechanism**. It never says *how* the request is sent — only what is sent and what must come back. That single property is what lets Chenile run the very same specification at two very different levels of the test pyramid.

<div class="callout key">
  <div class="t">One vocabulary, two implementations</div>
  Chenile provides the same Gherkin step vocabulary — <code>I POST a REST request to URL … with payload</code>, <code>the REST response key … is …</code>, <code>the http status code is …</code> — in <strong>two step libraries</strong>. Point your runner at one for a fast in-process unit test, or the other for a full integration test. The scenarios don't change.
</div>

<p style="text-align:center;margin:2em 0"><img src="/assets/img/chenile-bdd-reuse.svg" alt="One feature file reused across MockMvc unit tests and REST Assured integration tests"></p>

## Level 1 — unit / component tests over Spring MockMvc

For fast tests that run on every build, Chenile's **`cucumber-utils`** (in `chenile-core`) implements the step vocabulary on top of **Spring `MockMvc`**. The service is stood up in an **ephemeral, in-process instance** — no network, no deployed server — and requests are driven from the outside.

Because the request enters through the real Chenile controller and pipeline, this is not a narrow unit test of one method: it exercises the service **and its interceptors** — the very policies from [part 3](/concepts/03-service-policies/). You are testing governance, not just logic.

The wiring is three small classes plus your feature files:

```java
// 1) The runner — glue points at your steps + Chenile's REST steps
@RunWith(Cucumber.class)
@CucumberOptions(
    features = "src/test/resources/features",
    glue = { "classpath:com/mycompany/app/bdd",
             "classpath:org/chenile/cucumber/rest" },   // reusable steps
    plugin = { "pretty" })
@ActiveProfiles("unittest")
public class CukesRestTest {}
```

```java
// 2) Spring + MockMvc bootstrap (ephemeral instance)
@SpringBootTest(webEnvironment = RANDOM_PORT, classes = SpringTestConfig.class)
@AutoConfigureMockMvc
@CucumberContextConfiguration
@ActiveProfiles("unittest")
public class CukesSteps {
    @Given("dummy") public void dummy() {}   // add service-specific steps here
}
```

```java
// 3) Test configuration — scans Chenile + your service beans
@Configuration
@SpringBootApplication(scanBasePackages = {
    "org.chenile.configuration", "com.mycompany.app.configuration" })
@ActiveProfiles("unittest")
public class SpringTestConfig extends SpringBootServletInitializer {}
```

Most of the steps you need already live in `org.chenile.cucumber.rest.RestCukesSteps`, so `CukesSteps` is usually just a hook for a handful of service-specific additions.

## Level 2 — integration tests over REST Assured

When you want to verify a **really deployed** service — the wire protocol, the packaging, the environment and config — Chenile's **`it-cucumber-utils`** (in the **`chenile-bdd`** repository) implements *the same step vocabulary* on top of **[REST Assured](https://rest-assured.io/)**. Instead of a MockMvc call, `I POST a REST request to URL …` now issues a real HTTP request against a running server:

```java
// it-cucumber-utils — same @When/@Then text, different engine
RestAssured.baseURI = targetHost;
RestAssured.port    = targetPort;

@When("I POST a REST request to URL {string} with payload")
// ... builds the request with REST Assured's given()/when()/then()
```

Point the integration runner's glue at `org.chenile.cucumber.rest` from `it-cucumber-utils`, deploy the service (locally, in a container, or to staging), and your existing scenarios now validate the live system end to end. `chenile-bdd` also ships `it-cucumber-sec-utils` for the same treatment of secured endpoints.

## Why this matters

<div class="split" style="margin:1.6em 0">
  <div class="panel good">
    <h3>✅ What you gain</h3>
    <ul>
      <li><strong>No duplicated test logic.</strong> One <code>.feature</code> is your unit and integration spec.</li>
      <li><strong>Governance is tested.</strong> Interceptors/policies run in the MockMvc path, so security, tenancy and i18n are covered.</li>
      <li><strong>Confidence at both speeds.</strong> Fast in-process tests on every build; full REST Assured tests before release.</li>
      <li><strong>Living documentation.</strong> Gherkin scenarios read as behaviour anyone can review.</li>
    </ul>
  </div>
  <div class="panel">
    <h3>🔁 What actually changes between levels</h3>
    <ul>
      <li>The <strong>runner</strong> and its glue package</li>
      <li>The <strong>step library</strong>: <code>cucumber-utils</code> ↔ <code>it-cucumber-utils</code></li>
      <li>The <strong>target</strong>: ephemeral MockMvc ↔ a deployed URL</li>
      <li><strong>Not</strong> the scenarios. Swap the glue, not the spec.</li>
    </ul>
  </div>
</div>

This is the same philosophy that runs through the rest of Chenile: **write a thing once, decide where it runs by configuration.** Policies run at the gateway or the last mile; a Gherkin spec runs as a unit test or an integration test. The behaviour is defined in exactly one place.

<div class="callout">
  <div class="t">Where to look</div>
  Reusable steps: <code>org.chenile.cucumber.rest.RestCukesSteps</code> (MockMvc, in <code>cucumber-utils</code>) and the REST Assured equivalent in <code>chenile-bdd/it-cucumber-utils</code>. Working samples live in the <code>chenile-samples</code> projects <em>chenile-bdd-sample</em> and <em>service-with-persistence</em>.
</div>
