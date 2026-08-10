---
title: "Separate the service definition from the implementation"
short: "Definition vs. implementation"
order: 2
summary: "A service is a contract, not a codebase. Chenile splits the interface and model into an api module that consumers depend on, and the logic into a service module that nobody depends on."
---

## A service is what it promises, not how it keeps the promise

The single most important idea in Chenile is a boundary you can see in the file system:

- The **service definition** — the interface and the model objects — lives in an **`api` module**.
- The **service implementation** — the actual logic — lives in a separate **`service` module**.

Consumers depend on the *definition*. They never depend on the *implementation*.

This is the **Dependency Inversion Principle** (DIP) made physical: higher-level modules must not depend on lower-level modules; both should depend on an abstraction. In Chenile the abstraction is a real Maven artifact you can point at.

<div class="callout key">
  <div class="t">The rule</div>
  If service <code>s2</code> needs to call service <code>s1</code>, then <code>s2</code> depends on <strong><code>s1-api</code></strong> — never on <code>s1-service</code>. The implementation is invisible to its callers.
</div>

## What that looks like on disk

A generated Chenile service is two modules under one parent:

```
s1/
├── pom.xml            (parent — pins versions, wires the two modules)
├── s1-api/            ← the DEFINITION (a library)
│   └── .../s1/
│       ├── model/     → S1Entity.java        (the data contract)
│       └── service/   → S1Service.java       (the interface)
└── s1-service/        ← the IMPLEMENTATION (a library, then deployed via a monolith)
    └── .../s1/
        ├── configuration/  → Spring @Configuration + a Chenile controller
        └── service/
            ├── healthcheck/ → S1HealthChecker.java
            └── impl/        → S1ServiceImpl.java
```

The `api` module has no implementation, no transport code, and no framework entanglement. It is the smallest possible thing a consumer needs in order to call the service.

The `service` module depends on `api` (it implements the interface) and may depend on the `api` modules of *other* services it calls. Notice what it does **not** contain: it is not a deployable on its own. Service modules are packaged as libraries and assembled into a deployable — one service per process, or many services in a single **modulith** — without touching their code.

## The implementation is boringly pure

Because the definition carries the contract and policies carry the cross-cutting concerns (that's [part 3](/concepts/03-service-policies/)), the implementation gets to be almost nothing but business logic:

```java
public class S1ServiceImpl implements S1Service {
    @Override
    public S1Entity op1(S1Entity s1Entity) {
        // Just the business rule. No auth check, no logging setup,
        // no tenant lookup, no retry wrapper.
        s1Entity.id = "S1ServiceImpl";
        return s1Entity;
    }
}
```

Chenile also asks every service to ship a **health checker** — a deep probe that verifies the service can actually do its job (dependencies reachable, config valid), so orchestrators can decide when to route traffic or recycle an instance.

```java
public class S1HealthChecker implements HealthChecker {
    @Override
    public HealthCheckInfo healthCheck() {
        HealthCheckInfo info = new HealthCheckInfo();
        info.healthy = true;          // probe DBs, downstreams, config here
        return info;
    }
}
```

## Controller vs. service: the seam where policies attach

Chenile customizes the Spring controller so that a service is *declared* to the framework, not just exposed over HTTP. The controller marks a class as a Chenile service and defines the seam where the interception pipeline — the policies — gets hooked in around each operation.

That seam is the whole point. Because business logic lives in the implementation and the framework owns the seam around it, **horizontal requirements never have to be written inside the service.** They become policies.

That is where the story goes next.
