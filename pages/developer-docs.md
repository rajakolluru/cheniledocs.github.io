---
layout: doc
title: Developer documentation
description: Practical Chenile guides for building, securing, scaling and extending services.
permalink: /developer-docs/
---

# Developer documentation

These guides focus on implementing Chenile services and safely extending their runtime behavior. Use the sidebar to move between them and the release notes.

## Services &amp; security

- [Security &amp; the auth framework]({{ '/developer/security/' | relative_url }}) — the legacy Keycloak-integrated framework and the new Spring-Security auth-server / gateway / resource-server framework, and the responsibility split between framework and application.
- [Annotation-based Chenile services]({{ '/concepts/annotation-based-services/' | relative_url }}) — define a service with annotations on a plain bean (no Spring REST controller) and make registry registration optional. *(Lives under Concepts.)*

## Scaling &amp; integration

- [Process management]({{ '/developer/process-management/' | relative_url }}) — orchestrate long-running parent/child processes, map-reduce style, with in-VM, queue-based or JDBC/KEDA worker modes.
- [Beyond HTTP — alternate entry points]({{ '/developer/entry-points/' | relative_url }}) — trigger the same service from an event, a cron schedule (scheduler) or a dropped file (file-watch), plus caching.
- [Messaging transports]({{ '/developer/messaging-transports/' | relative_url }}) — configure MQTT, Kafka, Azure Event Hubs, in-JVM pub/sub and the cloud-edge switch behind the one pub/sub interface.
- [MCP — services as AI tools]({{ '/developer/mcp/' | relative_url }}) — expose services, workflows and queries to AI agents over the Model Context Protocol.
- [External API logging]({{ '/developer/external-api-logging/' | relative_url }}) — capture and publish inbound/outbound third-party API traffic for audit.

## Data &amp; queries

- [Numeric JPA identifiers]({{ '/developer/jpa-numeric-ids/' | relative_url }}) — database- or application-generated Long/Integer IDs in ordinary JPA entities, without changing workflow APIs.
- [Chenile Query &amp; JDBC Query Catalog]({{ '/developer/query-catalog/' | relative_url }}) — metadata-driven MyBatis queries and the startup-loaded JDBC catalog for reviewed promotion of query definitions.

## Workflow development

- [Extending STM workflows]({{ '/developer/stm-workflow-extension/' | relative_url }}) — XML-overlay vs. configuration properties when a workflow must vary by module, tenant or deployment; plus the per-request `EntityStore` selection contract.
- [Multi-tenant workflow extension sample]({{ '/developer/multitenant-workflow-extension/' | relative_url }}) — apply the XML-overlay pattern to a reusable vehicle workflow.

## Operate &amp; build

- [Admin UI]({{ '/developer/admin-ui/' | relative_url }}) — a drop-in React console at `/chenile/admin` for inspecting services, definitions, health, workflow diagrams and the service registry.
- [Config Maven plugin]({{ '/developer/config-maven-plugin/' | relative_url }}) — generate the service-registry JSON of a deployable at build time.

## Releases

- [Release notes]({{ '/release-notes/' | relative_url }}) — per-version notes, in the sidebar.

## Start with the source

The runnable examples and framework source are the definitive implementation references:

- [Chenile core](https://github.com/ajapros/chenile-core) · [Chenile samples](https://github.com/ajapros/chenile-samples)
