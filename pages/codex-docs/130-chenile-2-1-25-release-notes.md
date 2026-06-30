---
title: Chenile 2.1.25 Release Notes
keywords: chenile 2.1.25 release notes security auth mfa gateway samples database
tags: [chenile release notes security auth mfa samples database]
sidebar: codex_sidebar
permalink: /codex-chenile-2-1-25-release-notes.html
folder: codex-docs
summary: Release notes for Chenile 2.1.25 covering the auth framework, tenant-level MFA, security auth sample, and documentation updates.
---

Chenile `2.1.25` expands the new security auth framework and updates the reference sample to show a production-style tenant authentication setup.

## Highlights

### Auth framework MFA support

- `chenile-security/auth-framework` now exposes MFA extension contracts in the auth core module.
- The auth server can return an MFA challenge instead of immediately issuing tokens after primary authentication.
- A new `/api/login/mfa/verify` endpoint verifies a pending second-factor challenge and issues the final token.
- Token claims now expose MFA context through `mfa`, `amr`, `mfa_provider`, and `mfa_provider_type`.
- Primary authentication method tracking now preserves the real provider type instead of assuming password for every non-Google login.

### Application-owned MFA implementation

- `security-auth-sample/auth-implementation` now includes a JPA/Postgres implementation of tenant MFA policy and challenge persistence.
- Tenant policy is stored separately from user provider registration so each tenant can independently require or skip MFA.
- Durable challenge records support pending, verified, and failed lifecycle states.
- Challenge verification enforces expiry and failed-attempt handling.
- A pluggable `MfaProvider` example shows how to integrate third-party email, SMS, push, or enterprise MFA providers.

### Sample UI and developer flow

- The React demo UI now handles both immediate-token login responses and MFA challenge responses.
- The UI can complete Google or password login flows that require a second factor.
- The sample README and runbook document tenant-alpha MFA, tenant-beta password-only login, curl flows, and extension points.

### Test coverage

- Framework integration tests cover no-MFA login, MFA-required login, successful MFA verification, and invalid-code rejection.
- Sample integration tests run against Postgres through Testcontainers and apply the real Liquibase changelogs.
- Sample service tests continue to validate unauthenticated access, tenant mismatch rejection, ACL/scope rejection, and successful authorized access.

## Database changes

The security auth sample adds Liquibase change set:

`auth-implementation/src/main/resources/db/changelog/003-mfa.sql`

It creates:

- `tenant_mfa_policy`: tenant/client/provider level MFA policy.
- `mfa_challenge`: durable MFA challenge lifecycle table.

Seed behavior:

- `tenant-alpha` requires email OTP MFA.
- `tenant-beta` does not require MFA.
- `platform` has admin-style OTP policy.

These tables are sample-owned. Applications adopting the framework can use the same shape or map the framework contracts to their own IAM schema.

## Upgrade notes

- Applications that do not provide `MfaPolicyService` and `MfaChallengeService` continue to behave as primary-auth-only systems.
- Applications that enable MFA should use durable storage for challenge state before scaling auth-server pods.
- Services requiring step-up authentication should validate `mfa=true` and the expected `amr` values from the JWT.
- Do not copy deterministic sample OTP secrets into production.

## Documentation updates

- Added [Chenile Security Auth Framework](/developer-chenile-security-auth-framework.html).
- Expanded [Security Auth Sample](/developer-chenile-samples-security-auth.html) with database, UI, MFA, gateway, testing, and production guidance.
- Updated the developer sidebar and docs index links for the new auth framework guide.
