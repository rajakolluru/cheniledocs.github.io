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
- create a small auth-server boot app that imports the implementation module
- create a small gateway boot app with route config
- keep resource-service JWT validation and authorization rules inside each service
- seed local/dev data through Liquibase or your production migration tool

Do not copy or modify `chenile-security/auth-framework` into an application repository.
