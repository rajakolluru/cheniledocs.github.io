---
layout: doc
title: Security &amp; the auth framework
description: Chenile's two security models — the legacy Keycloak-integrated framework and the new Spring-Security auth-server / gateway / resource-server framework.
permalink: /developer/security/
---

# Security &amp; the auth framework

Security in Chenile has two tracks, kept in separate directories in `chenile-security` so an application adopts one without being forced to migrate the other:

- **`legacy-security/`** — the existing framework: `chenile-security-api`, `chenile-security`, the `security-interceptor`, Keycloak integration, and `cucumber-sec-utils`. Artifact names are unchanged; only the source directory moved.
- **`auth-framework/`** — a new, opt-in Spring-Security auth-server, gateway and resource-server framework.

## Where security runs

Security is a [service policy](/concepts/03-service-policies/), so it runs as an interceptor in the pipeline — and, per [policy placement](/concepts/04-policy-placement/), at both ends: coarse authentication at the **gateway**, fine-grained authorization at the **last mile**. The two frameworks below are the concrete implementations of that idea.

## Legacy security

Use the `legacy-security` modules when an application already relies on the current Chenile security API, Keycloak integration, or the `security-interceptor`. The `security-interceptor` enforces the `meta-acls` permissions you attach to service operations (and to workflow events — see [Finito](https://thefinito.org)), and `cucumber-sec-utils` / `it-cucumber-sec-utils` give you BDD steps that exercise secured endpoints.

## The new auth framework

The `auth-framework` gives you a Chenile-managed **auth-server**, **gateway**, and **resource-server** integration, with JWT validation, a tenant-aware request context, and trusted claim-to-header relay. Its opt-in artifacts:

- `chenile-security-auth-core` — shared contracts.
- `chenile-security-auth-server` — login APIs, OAuth-style token issuing, provider callbacks, MFA challenge/verify, and `/api/service/me`.
- `chenile-security-gateway` — gateway token validation and request relay to backend services.
- `chenile-security-starter-auth-server`, `-starter-gateway`, `-starter-resource-server` — Spring Boot starters that assemble the beans with sensible defaults.

> Applications that already have an identity provider can skip `chenile-security-auth-server` and use only the **gateway** and **resource-server** starters.

### The responsibility split

The design keeps framework code reusable by owning *protocol*, and letting each application own its *data*:

<div class="split" style="margin:1.4em 0">
  <div class="panel good">
    <h3>✅ The framework owns</h3>
    <ul>
      <li>login orchestration</li>
      <li>token creation &amp; verification (JWT)</li>
      <li>the public API shape of the auth-server flows</li>
      <li>optional MFA challenge hand-off</li>
      <li>gateway token validation &amp; request relay</li>
      <li>resource-server integration contracts</li>
    </ul>
  </div>
  <div class="panel">
    <h3>🧩 The application owns</h3>
    <ul>
      <li>tenant &amp; realm storage</li>
      <li>user identity, client &amp; provider registrations</li>
      <li>MFA policy &amp; challenge persistence, external MFA providers</li>
      <li>service-level authorization rules</li>
    </ul>
  </div>
</div>

You implement the contracts — `TenantRegistry`, `ExternalProviderService`, `MfaPolicyService`, `MfaChallengeService`, `MfaProvider` — as beans (backed by JDBC, JPA, LDAP, a remote IAM, or a mix). You do **not** fork framework code for tenant-specific rules.

### How a secured request flows

1. The **gateway** validates the JWT, resolves the **tenant** into the request context, and relays trusted claims to backend services as headers.
2. Backend **resource-servers** trust those headers and enforce fine-grained, resource-aware authorization at the last mile.
3. The **auth-server** (if you use it) issues and refreshes tokens, handles provider callbacks (e.g. Google) and MFA challenge/verify, and exposes `/api/service/me`.

Because the tenant lands in the same `ContextContainer` Chenile uses everywhere, [multi-tenant routing](/concepts/13-multi-tenant-saas/) of data and config follows automatically from an authenticated request.

<div class="callout"><div class="t">Stack &amp; sample</div>
The new modules target Spring Boot&nbsp;4 / Java&nbsp;25 and Spring Cloud Gateway (Spring Cloud BOM <code>2025.1.2</code>). A full Postgres-backed reference — auth-server app, protected services, runtime assets and a React demo UI — lives in <code>chenile-samples/security-auth-sample</code>.</div>
