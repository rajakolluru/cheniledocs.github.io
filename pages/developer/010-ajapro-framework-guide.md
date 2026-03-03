---
title: Ajapro Framework Developer Guide
keywords: ajapro developer guide chenile frameworks
tags: [developer chenile]
sidebar: developer
permalink: /developer-ajapro-framework-guide.html
summary: Technical guide to use the frameworks and modules inside /ajapro
---

## Purpose

This guide explains how developers can use and contribute to the framework modules in:

`/ajapro`

The directory contains multiple Chenile framework repositories plus samples and docs.

## Directory Map

- `chenile-parent`: Super parent BOM/parent POM used to align framework versions.
- `chenile-core`: Core runtime modules (`chenile-core`, `chenile-base`, `chenile-http`, `stm`, `owiz`, `utils`, etc.).
- `chenile-security`: Security modules (`chenile-security`, `chenile-security-api`, interceptors, cucumber sec utils).
- `chenile-mqtt`: Messaging integrations (MQTT/Kafka/pub-sub, cloud-edge-switch).
- `chenile-proxies`: HTTP/event proxy framework modules.
- `chenile-query-workflow-blueprints`: Query/workflow APIs, services, and blueprint utilities.
- `chenile-process-management`: Long-running process orchestration modules.
- `chenile-service-registry`: Service registry API/delegate/service.
- `chenile-bdd`: BDD/integration-test helpers.
- `chenile-others`: Additional modules (cache, filewatch, scheduler, config maven plugin).
- `chenile-samples`: Sample apps showing framework usage.
- `cheniledocs.github.io`: Documentation site (this repo).

## Prerequisites

- JDK 25 (current `chenile-parent` sets `<java.version>25</java.version>`).
- Maven (used in all module builds).
- Git.
- GNU Make (recommended; all framework repos provide Make targets).
- Optional: `xmlstarlet` (required by `/ajapro/update_all.sh`).

## Quick Start For Framework Consumers

If you are building your own service using Chenile:

1. Use `org.chenile:chenile-parent` as the parent in your `pom.xml`.
2. Set `<chenile.parent.version>` to the version you want to consume.
3. Add only the module dependencies your service needs.

Example:

```xml
<parent>
  <groupId>org.chenile</groupId>
  <artifactId>chenile-parent</artifactId>
  <version>2.1.12</version>
</parent>

<dependencies>
  <dependency>
    <groupId>org.chenile</groupId>
    <artifactId>chenile-core</artifactId>
  </dependency>
  <dependency>
    <groupId>org.chenile</groupId>
    <artifactId>chenile-http</artifactId>
  </dependency>
  <dependency>
    <groupId>org.chenile</groupId>
    <artifactId>chenile-security</artifactId>
  </dependency>
</dependencies>
```

Use module-specific artifacts only when required (for example `chenile-kafka`, `workflow-service`, `process-service`, `service-registry-service`).

## Local Build Workflow

Each framework repo follows the same pattern:

1. Enter a module repo, for example:
   `cd /ajapro/chenile-core`
2. Build with the repo's version file:

```bash
make build
```

This runs Maven using a `revision` value from the module version file (for example `chenile-core-version.txt`).

Equivalent direct Maven command:

```bash
mvn -Drevision=$(cat chenile-core-version.txt) install
```

Useful common targets across repos:

- `make clean`
- `make javadoc`
- `make test-javadoc`
- `make prepare-deploy`
- `make deploy`

## Working Across Multiple Repos

Use the top-level script to align child repo parent versions to the current `chenile-parent` value:

```bash
cd /ajapro
./update_all.sh
```

What it does:

- Reads `chenile.parent.version` from `chenile-parent/pom.xml`.
- Updates `<parent><version>` in each sibling repo `pom.xml`.
- Shows a summary.
- Optionally commits and pushes updated repos.

## Recommended Developer Flow

1. Build and publish/install `chenile-parent` changes first.
2. Build changed framework repos (`chenile-core`, `chenile-security`, etc.).
3. Validate behavior in `chenile-samples`.
4. Update docs in `cheniledocs.github.io` if APIs/config changed.

## Choosing the Right Framework Modules

- Use `chenile-core` for base service runtime, interceptors, STM/orchestration internals.
- Add `chenile-security` for authentication/authorization flows.
- Add `chenile-proxies` for local/remote proxy abstraction.
- Add `chenile-mqtt` for MQTT/Kafka/pub-sub messaging integrations.
- Add `chenile-query-workflow-blueprints` for query/workflow patterns and utilities.
- Add `chenile-process-management` when implementing long-running orchestration.
- Add `chenile-service-registry` for service discovery/registry use cases.
- Add `chenile-bdd` and cucumber utils for integration-level BDD testing.

## Validate With Samples

Use `chenile-samples` to verify upgrades or new feature behavior before consuming in product code:

```bash
cd /ajapro/chenile-samples
mvn install
```

Then run the sample app relevant to your module area.

## Troubleshooting

- Version drift across repos:
  Run `/ajapro/update_all.sh`.
- Build errors from Java version mismatch:
  Ensure JDK 25 is active.
- Dependency mismatch:
  Keep services on a single `chenile-parent` version and avoid mixing module versions manually.

