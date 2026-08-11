---
title: "Trajectories: run alternate behaviour without branching your code"
short: "Trajectories"
order: 14
summary: "A trajectory is an ephemeral, per-request variant of the system. Set a header, and Chenile swaps in a different service implementation, a different workflow action, and different configuration — with no if-statements and nothing to untangle later."
---

## The problem trajectories solve

Sooner or later you need the *same* service to behave differently for a slice of traffic — an A/B experiment, a canary, a partner-specific tweak, a migration from an old implementation to a new one, or a test double. The tempting fix is an `if`:

```java
if ("t1".equals(trajectory)) { /* special case */ } else { /* normal */ }
```

That gets ugly fast, and it's worse to *remove*: variant logic is **ephemeral** — you want it in for the experiment and gone cleanly afterwards, not fossilized in branches across the codebase.

A **trajectory** is Chenile's answer. It's a named variant selected per request by the header **`x-chenile-trajectory-id`**. When that header is present, Chenile transparently routes to trajectory-specific beans and values. Your default code never changes, and the variant lives in its own module you can delete when you're done.

<div class="callout key">
  <div class="t">One header, three kinds of override</div>
  Set <code>x-chenile-trajectory-id: t1</code> and, for that request only, Chenile can select a different <strong>service implementation</strong>, a different <strong>workflow transition action / auto-state</strong>, and a different <strong>configuration value</strong> — each independently, none of it hard-coded.
</div>

## See it switch

Pick a trajectory (or press Play). Watch which implementation, workflow action and config value Chenile resolves — and note that overrides are *selective*:

<div class="jsx" data-jsx="trajectory"></div>

## 1 · A different service implementation

Put the variant in its own module (say `s1-t1-service` depending on `s1-service`) and register the alternate bean with **`@ConditionalOnTrajectory`**:

```java
@Bean
@ConditionalOnTrajectory(id = "t1", service = "s1Service")
public S1Service s1T1Service() {
    return new S1T1ServiceImpl();   // its own logic, its own message bundle (error 1235)
}
```

Same URL, same service registration — Chenile's `ConstructServiceReference` interceptor reads the trajectory from the exchange and, when it's `t1`, hands the request to `s1T1Service` instead of the default. Even the message bundle can differ, so error `1234 "not valid"` becomes `1235 "is illegal"` on `t1`. A request with no header (or `t2`) still gets the default bean.

```gherkin
When I construct a REST request with header "x-chenile-trajectory-id" and value "t1"
And  I POST a REST request to URL "/s1/op1" with payload "{}"
Then the REST response key "id" is "S1T1ServiceImpl"
```

## 2 · A different workflow action or auto-state

Trajectories reach into the state machine too. The [convention-based resolver](/concepts/09-registry-and-proxies/) that finds transition actions, auto-state computations and post-save hooks accepts **context prefixes** — so a trajectory can select a trajectory-specific bean for a given event. The `approve` transition can run `returnsApproveAction` normally and a `t1` variant under trajectory `t1`, chosen automatically by name. Your STM XML doesn't change; the wiring follows the trajectory.

## 3 · A different configuration value

Finally, [cconfig](/concepts/08-configuration-management/) resolves values per trajectory. Just as a *tenant* can override a setting, a *trajectory* can — so an experiment can flip a limit, a feature flag or an endpoint for its slice of traffic while the shared base config stays clean. Same mechanism, different custom attribute.

## Why this is powerful

<div class="split" style="margin-top:1.4em">
  <div class="panel good">
    <h3>✅ What you gain</h3>
    <ul>
      <li><strong>No branching.</strong> Zero <code>if (trajectory)</code> in business code.</li>
      <li><strong>Ephemeral by design.</strong> Variant lives in its own module — delete it to remove the experiment.</li>
      <li><strong>Selective.</strong> Override just the impl, just a workflow action, just config — or all three.</li>
      <li><strong>Composable with tenancy.</strong> Trajectories and tenants both ride the request context.</li>
    </ul>
  </div>
  <div class="panel">
    <h3>🧭 Great for</h3>
    <ul>
      <li>A/B tests and canaries</li>
      <li>Old→new implementation migrations</li>
      <li>Partner- or region-specific behaviour (a region can map to a trajectory)</li>
      <li>Test doubles and mocks in integration tests</li>
    </ul>
  </div>
</div>

<div class="callout"><div class="t">Where to look</div>
<code>@ConditionalOnTrajectory</code> and <code>ConstructServiceReference</code> in <code>chenile-core</code>; header handling in <code>HeaderUtils</code> / <code>RegionToTrajectoryConverter</code> (a region can derive a trajectory); trajectory-aware resolution in <code>STMTransitionActionResolver</code>; per-trajectory config in <code>cconfig</code>. Working example: the <code>s1</code> / <code>s1-t1-service</code> modules in <code>chenile-samples</code>.</div>
