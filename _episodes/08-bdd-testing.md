---
title: "Test once, run everywhere: BDD in Chenile"
order: 8
duration: "10–12 min"
summary: "The same Gherkin feature file as both a fast MockMvc unit test and a full REST Assured integration test. Write the behaviour once; choose where it runs."
---

**Episode goal:** show, live, that a single `.feature` file runs as an in-process MockMvc test *and* as a REST Assured integration test — reinforcing the series' theme (write once, place by configuration) on the testing axis.

<div class="script">
  <div class="beat k">Cold open</div>
  <div class="beat v"><strong>On camera:</strong> “We’ve kept business logic pure and governance consistent. Now — how do we <em>test</em> all of it without writing everything twice? Same trick as always: write the behaviour once, choose where it runs.”</div>

  <div class="beat k">The spec</div>
  <div class="beat v"><strong>On screen:</strong> open <code>service.feature</code>. Voiceover: “This is Gherkin. It says <em>what</em> the service does, never <em>how</em> the request is sent. That one property is why we can run it at two levels.”</div>

  <div class="beat k">Lower third</div>
  <div class="beat v">“One Gherkin vocabulary. Two step libraries.” Show the recurring diagram: one feature file branching to a MockMvc box and a REST Assured box.</div>

  <div class="beat k">Demo — unit level</div>
  <div class="beat v">Open <code>CukesRestTest</code>, <code>CukesSteps</code>, <code>SpringTestConfig</code>. Point at the glue: <code>org/chenile/cucumber/rest</code> from <strong>cucumber-utils</strong>. Run it. “No server, no network — Spring MockMvc stands the service up in-process and drives it from outside.”</div>

  <div class="beat k">The key insight</div>
  <div class="beat v"><strong>Voiceover:</strong> “Notice the request goes through the real Chenile controller and pipeline. So this isn’t a narrow method test — it exercises the service <em>and its interceptors</em>. We’re testing the security, tenancy and i18n policies too. Governance is under test.”</div>

  <div class="beat k">Demo — integration level</div>
  <div class="beat v">Switch to the integration runner whose glue points at <strong>it-cucumber-utils</strong> from <code>chenile-bdd</code>. Deploy the service (container or staging). Run the <em>same</em> feature file. “Same scenarios. But now <code>I POST a REST request…</code> is REST Assured hitting a real URL over HTTP.”</div>

  <div class="beat k">Diff on screen</div>
  <div class="beat v">Side-by-side the two <code>RestCukesSteps</code>: identical <code>@When</code>/<code>@Then</code> text, different engine — MockMvc vs <code>RestAssured.given()</code>. “Swap the glue, not the spec.”</div>

  <div class="beat k">Payoff</div>
  <div class="beat v"><strong>Voiceover:</strong> “Fast in-process tests on every build; full REST Assured tests before release — from one specification. Your Gherkin doubles as living documentation. And <code>it-cucumber-sec-utils</code> does the same for secured endpoints.”</div>

  <div class="beat k">Callback</div>
  <div class="beat v">“Same philosophy as the whole series: write it once, decide placement by configuration. Policies at the gateway or last mile; a spec as a unit or integration test.”</div>

  <div class="beat k">Recap card</div>
  <div class="beat v">“One <code>.feature</code>, two step libraries: MockMvc (cucumber-utils) for unit tests, REST Assured (chenile-bdd) for integration. Swap the glue, not the spec.”</div>
</div>

**Companion reading:** [Test once, run everywhere: BDD across unit and integration](/concepts/06-bdd-testing/)
