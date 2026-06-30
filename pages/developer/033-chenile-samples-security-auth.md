---
title: Security Auth Sample
keywords: chenile samples security auth gateway oauth2 oidc
tags: [developer chenile samples security oauth2 gateway]
sidebar: developer
permalink: /developer-chenile-samples-security-auth.html
summary: Developer guide for using the Chenile security auth and gateway framework from chenile-samples
---

## Purpose

`security-auth-sample` shows how an application team should consume the Chenile auth framework without modifying framework code.

Module path:

`/ajapro/chenile-samples/security-auth-sample`

Framework path:

`/ajapro/chenile-security/auth-framework`

Framework guide:

[Chenile Security Auth Framework](/developer-chenile-security-auth-framework.html)

## Module Layout

- `auth-implementation`: application-owned JPA and Liquibase implementation of Chenile auth contracts.
- `auth-server-app`: runnable Spring Boot auth server assembled from `chenile-security-auth-server`.
- `gateway-app`: runnable Spring Boot gateway assembled from `chenile-security-gateway`.
- `service-a`: protected resource service that validates JWTs and calls service B.
- `service-b`: protected resource service with tenant/ACL checks.
- `demo-ui`: React UI for login, token acquisition, and service calls.
- `runtime`: Docker Compose, gateway route config, and image build assets.

## Dependency Pattern

Applications should depend on Chenile artifacts and keep their own persistence and business rules outside the framework.

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>chenile-security-auth-server</artifactId>
</dependency>
```

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>chenile-security-gateway</artifactId>
</dependency>
```

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>chenile-security-starter-resource-server</artifactId>
</dependency>
```

## Implementation Layers

- Framework contracts live in `chenile-security-auth-core`.
- Token and login flows live in `chenile-security-auth-server`.
- Gateway route, relay header, and token validation behavior live in `chenile-security-gateway`.
- Application tenant, user, client, provider, schema, and seed data live in `auth-implementation`.
- Service authorization rules remain local to each resource service.

## Auth Implementation Module

`auth-implementation` is the most important module for application developers. It demonstrates how to keep business-owned identity state outside the framework.

It provides:

- JPA entities for realms, users, clients, auth providers, tenant MFA policy, and MFA challenges.
- Spring Data repositories for provider lookup, active user lookup, tenant policy lookup, and challenge lifecycle.
- Liquibase changelogs for schema and seed data.
- Implementations of framework contracts such as tenant registry, provider config lookup, MFA policy, and MFA challenge handling.
- A mock external MFA provider that shows how a third-party provider can be plugged in without changing framework code.

The production rule is simple: copy the contract implementation pattern, not the sample seed data.

## Database Model

The sample uses Postgres and Liquibase. The MFA change set is:

`auth-implementation/src/main/resources/db/changelog/003-mfa.sql`

It adds two tables:

- `tenant_mfa_policy`: tenant-level decision table that says whether a realm requires MFA and which provider should be used.
- `mfa_challenge`: durable challenge table that stores challenge id, user, primary provider, client id, MFA provider, status, attempts, creation time, and expiry.

The seeded behavior is:

- `tenant-alpha`: MFA enabled using `email-otp`; sample code is `246810`.
- `tenant-beta`: MFA disabled; password login returns tokens immediately.
- `platform`: MFA enabled for admin-style flows using `admin-otp`.

In a real deployment, do not seed deterministic OTP codes. Use a provider that generates, sends, and verifies one-time codes or delegates to a trusted MFA service.

## Tenant MFA Flow In The Sample

For `tenant-alpha`, login is a two-step flow.

First authenticate the primary credential:

```bash
curl -s http://localhost:9000/api/login/authenticate \
  -H 'content-type: application/json' \
  -d '{"email":"alice@tenant-alpha.example","providerId":1,"credential":"password1!"}'
```

The response contains `nextStep: "mfa"` and a `challengeId`. Then verify the challenge:

```bash
curl -s http://localhost:9000/api/login/mfa/verify \
  -H 'content-type: application/json' \
  -d '{"challengeId":"<challenge-id>","code":"246810"}'
```

The verified response contains access and ID tokens. The token claims include `mfa=true`, `amr`, `mfa_provider`, and `mfa_provider_type`.

For `tenant-beta`, the same primary authentication returns tokens directly because the tenant policy disables MFA.

## UI Flow

`demo-ui` now understands both token responses and MFA challenge responses.

The UI flow is:

1. Identify the user by email.
2. Select or auto-select an auth provider.
3. Submit the primary credential or start Google login.
4. If the response contains `nextStep=mfa`, show the second-factor form.
5. Submit `challengeId` and MFA code to `/api/login/mfa/verify`.
6. Store the final token only after successful MFA verification.
7. Use the token to call gateway and service endpoints.

Google login can also require MFA. In that case the auth server redirects back to the UI with hash values containing `next_step=mfa` and `challenge_id`.

## Gateway And Service Validation

The gateway validates the token before routing requests. Resource services still own endpoint-level authorization.

The sample services demonstrate:

- unauthenticated request rejection
- tenant header mismatch rejection
- ACL or scope based rejection
- valid tenant token accepted by the correct service endpoint

If a real service requires MFA, check the token claims after JWT validation. For example, require `mfa=true` and confirm `amr` contains the expected second factor such as `otp`.

## Extending MFA

There are two common extension paths.

Use database-backed OTP when the application owns the provider secret:

- Add or provision a user auth provider row.
- Enable `tenant_mfa_policy` for the tenant.
- Set `provider_key` to the user provider key.
- Verify the submitted code against the stored provider secret or generated challenge secret.

Use third-party MFA when another system owns the factor:

- Implement `org.chenile.security.auth.framework.contract.MfaProvider`.
- Return a stable `providerKey()` and `providerType()`.
- Generate a safe destination hint.
- Delegate `verify(...)` to the third-party provider.
- Point `tenant_mfa_policy.provider_key` and `provider_type` to that provider.

The sample includes `MockExternalMfaProvider` only as a local reference. Replace it with a real email, SMS, push, or enterprise MFA integration in production.

## Configuration Namespaces

Framework-owned properties use:

```yaml
chenile:
  security:
    auth-server:
    gateway:
    jwt:
```

Sample-owned application properties use:

```yaml
sample:
  security:
```

This separation is intentional. Teams should not add application-specific properties under `chenile.security.*` unless they are extending the framework contract.

## Run Locally

Install the framework and run the sample:

```bash
cd /ajapro/chenile-samples/security-auth-sample
./run.sh
```

The script builds local `chenile-security` artifacts, packages the sample modules, and starts Docker Compose.

Local endpoints:

- Auth server: `http://localhost:9000`
- Gateway: `http://localhost:8080`
- Service A: `http://localhost:8081`
- Service B: `http://localhost:8082`
- Postgres: `localhost:15432`

## Validate Locally

Backend tests:

```bash
cd /ajapro/chenile-samples/security-auth-sample
mvn test
```

Targeted auth-server integration tests:

```bash
mvn -pl auth-server-app -am test
```

UI build:

```bash
cd /ajapro/chenile-samples/security-auth-sample/demo-ui
npm install
npm run build
```

The auth-server integration test starts Postgres through Testcontainers and applies the real Liquibase changelogs. That validates the tenant MFA policy and challenge tables against a real database.

## UI

The UI is in:

`security-auth-sample/demo-ui`

Run it with:

```bash
npm install
npm run dev
```

The UI is intentionally separate from backend packaging so teams can replace it with their own frontend while preserving the same auth server and gateway APIs.

## What To Copy Into A Real Application

Copy the pattern, not the framework internals:

- create an app-owned implementation module for `TenantRegistry` and provider lookup
- implement `MfaPolicyService` and `MfaChallengeService` if tenant-level MFA is required
- implement `MfaProvider` for external email, SMS, push, or enterprise MFA integrations
- create a small auth-server boot app that imports the implementation module
- create a small gateway boot app with route config
- keep resource-service JWT validation and authorization rules inside each service
- seed local/dev data through Liquibase or your production migration tool

Do not copy or modify `chenile-security/auth-framework` into an application repository.

## Production Checklist

- Store MFA challenges in a durable database so auth-server pods can restart or scale horizontally.
- Enforce challenge expiry and retry limits.
- Do not expose OTP secrets through logs, UI hints, or token claims.
- Keep tenant policy changes auditable.
- Use different provider keys for different MFA mechanisms.
- Validate the `mfa` and `amr` claims in services that need step-up authentication.
- Keep sample deterministic credentials out of production data.
