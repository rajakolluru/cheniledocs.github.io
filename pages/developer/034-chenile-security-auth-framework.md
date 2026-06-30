---
title: Chenile Security Auth Framework
keywords: chenile security auth framework mfa gateway oauth2 oidc jwt tenant
tags: [developer chenile security auth oauth2 mfa gateway]
sidebar: developer
permalink: /developer-chenile-security-auth-framework.html
summary: Technical guide for the Chenile security auth framework, gateway integration, token model, and tenant-level MFA extension points.
---

## Purpose

The Chenile security auth framework provides reusable building blocks for an auth server, gateway, and resource-server integration. It is designed so the framework owns protocol flow and token generation, while each application owns its tenant, user, client, provider, MFA, and authorization data.

Framework path:

`/ajapro/chenile-security/auth-framework`

Reference implementation path:

`/ajapro/chenile-samples/security-auth-sample`

## Module Model

The framework is separated from the existing Chenile security implementation so users can adopt it without forcing a migration of legacy security code.

- `core`: shared contracts such as `TenantRegistry`, `ExternalProviderService`, `MfaPolicyService`, `MfaChallengeService`, and `MfaProvider`.
- `auth-server`: login APIs, OAuth-style token issuing, Google callback handling, MFA challenge/verify flow, and `/api/service/me`.
- `gateway`: gateway validation and relay behavior for routing secured requests to backend services.
- `starters`: Spring Boot starter modules that assemble framework beans with sensible defaults.

Applications should depend on the framework artifacts and provide implementation beans. They should not fork framework code for tenant-specific rules.

## Responsibility Split

The framework owns:

- login orchestration
- token creation and verification
- public API shape for auth server flows
- optional MFA challenge hand-off
- gateway token validation and request relay
- resource-server integration contracts

The application owns:

- tenant and realm storage
- user identity storage
- client registrations
- provider registrations and secrets
- MFA policy storage
- MFA challenge persistence
- external MFA provider integration
- service-level authorization rules

This split keeps framework code reusable and lets applications use JDBC, JPA, LDAP, remote IAM, third-party MFA, or a mixed model behind the same contracts.

## Core Authentication Flow

The browser or API client first identifies the user by email:

```http
POST /api/login/identify
Content-Type: application/json

{"email":"alice@tenant-alpha.example"}
```

The auth server returns the tenant and available providers for that user. If a password or OTP provider is selected, the client submits:

```http
POST /api/login/authenticate
Content-Type: application/json

{
  "email": "alice@tenant-alpha.example",
  "providerId": 1,
  "credential": "password1!"
}
```

If no second factor is required, the response contains tokens. If the tenant policy requires MFA, the response contains `nextStep: mfa`, a `challengeId`, display metadata, and expiry information. A token is not issued until the challenge is verified.

## Tenant-Level MFA Flow

MFA is optional and contract driven. The framework checks for `MfaPolicyService` and `MfaChallengeService` beans. If they are absent, login remains password/provider-only.

When present, the framework executes this sequence:

1. Primary provider authentication succeeds.
2. `MfaPolicyService.evaluate(...)` decides whether the tenant/client/provider combination needs a second factor.
3. If MFA is not required, the framework issues a token with `mfa=false`.
4. If MFA is required, `MfaChallengeService.start(...)` creates a challenge and returns challenge metadata to the client.
5. The client calls `/api/login/mfa/verify` with `challengeId` and `code`.
6. `MfaChallengeService.verify(...)` validates the code and returns the original primary provider context.
7. The framework issues the final token with MFA claims.

Verification endpoint:

```http
POST /api/login/mfa/verify
Content-Type: application/json

{
  "challengeId": "generated-challenge-id",
  "code": "246810"
}
```

## MFA Contracts

`MfaPolicyService` is the policy decision point. A typical implementation reads tenant policy from a database and returns either `MfaPolicy.notRequired()` or a required policy with provider metadata.

Important policy fields:

- `required`: whether a second factor is mandatory.
- `providerKey`: application/provider identifier such as `email-otp`, `sms-otp`, or `mock-external-mfa`.
- `providerType`: provider category such as `OTP`, `EMAIL_OTP`, `SMS_OTP`, `PUSH`, or `EXTERNAL`.
- `displayName`: user-facing label.
- `destinationHint`: safe hint for UI display.
- `challengeTtl`: expiry duration for a challenge.
- `allowedProviderTypes`: types that the policy allows.

`MfaChallengeService` owns durable challenge lifecycle. In production it should persist challenge state, expiry, attempt count, and verified/failed status.

`MfaProvider` is optional and useful for third-party or non-database verification. If an application registers an `MfaProvider`, the challenge service can delegate code verification to that provider instead of checking a locally stored secret.

## Token Claims

The framework adds authentication-method claims so gateways and services can make authorization decisions based on MFA strength.

- `auth_provider`: provider key used for the primary login.
- `auth_provider_type`: primary provider type.
- `mfa`: `true` only when a second factor was verified.
- `amr`: authentication methods used, for example `["pwd"]`, `["pwd","otp"]`, or `["google","otp"]`.
- `mfa_provider`: provider key used for MFA.
- `mfa_provider_type`: provider type used for MFA.

Resource services should not re-run MFA. They should validate the JWT and inspect these claims when an endpoint requires a stronger authentication method.

## External Providers

Google login remains a first-factor provider. A successful Google callback can still be followed by tenant-level MFA. If MFA is required after Google login, the auth server redirects the UI with a hash containing `next_step=mfa` and `challenge_id`.

The same extension model can support third-party MFA:

- Add a tenant policy row pointing to an external provider key.
- Register a Spring bean implementing `MfaProvider`.
- Persist the challenge through `MfaChallengeService`.
- Delegate verification to the provider.

The framework does not prescribe vendor APIs, SMS providers, email providers, or push notification providers.

## Production Guidance

Use durable storage for challenges. In-memory challenges are not safe when the auth server runs more than one pod or restarts during login.

Expire challenges aggressively and enforce attempt limits. The sample uses pending, verified, and failed status values with a retry cap.

Keep tenant policy separate from user provider registration. A tenant policy decides whether MFA is required; a user/provider registration or external MFA provider decides whether the user can satisfy that factor.

Do not put sensitive OTP values in logs, UI hints, or token claims. Sample seed data uses known values only to make local development and tests deterministic.

For high-risk services, check both `mfa=true` and `amr` contents instead of trusting only that a token exists.

## Testing Strategy

Framework tests should cover the contract behavior without tying to one database schema:

- password login without MFA returns a token with `mfa=false`
- password login with MFA returns a challenge and no token
- MFA verify returns a token with `mfa=true` and the expected `amr`
- invalid MFA code returns `401`
- non-password provider types preserve the correct primary `amr`

Application tests should cover the real persistence and migration path:

- Liquibase creates policy and challenge tables
- tenant A requires MFA and tenant B does not
- expired or failed challenges cannot be reused
- services can read MFA claims from `/api/service/me` or validated JWTs

## Related Docs

- [Security Auth Sample](/developer-chenile-samples-security-auth.html)
- [Chenile Samples Developer Guide](/developer-chenile-samples.html)
- [Ajapro Framework Developer Guide](/developer-ajapro-framework-guide.html)
