---
title: Chenile Workflow Blueprint
keywords: chenile  stm state-transition fsm finite-state blueprint
sidebar: chenile_sidebar
toc: true
permalink: /chenile-workflow-blueprint.html
folder: chenile
summary: Using the Chenile Workflow Blueprint to write Workflow services
---

# Chenile Workflow Blueprint

The workflow blueprint provides reusable APIs and runtime implementation for services whose entities move through a state machine.

The common dependency is `workflow-service`. It provides the generic `StateEntityService` implementation, transition processing, allowed-action lookup, entity retrieval, activity helpers, and post-save hooks.

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>workflow-service</artifactId>
  <version>${chenile.query.workflow.blueprints.version}</version>
</dependency>
```

## Optional MCP Metadata

Do not add MCP dependencies to every workflow service by default.

If the workflow service must expose MCP metadata for polymorphic workflow operations, add `workflow-mcp`:

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>workflow-mcp</artifactId>
  <version>${chenile.query.workflow.blueprints.version}</version>
</dependency>
```

`workflow-mcp` contains the MCP-specific bridge classes, including `ProcessIdPolymorph`. It depends on `workflow-service` and `chenile-mcp`.

## Process By ID Payloads

Workflow `processById` calls receive an event id and a payload. Different events can use different payload classes. `StmBodyTypeSelector` resolves the payload type from workflow event metadata or from transition action signatures.

When MCP is enabled, `ProcessIdPolymorph` reads the selector metadata and publishes one MCP variant per event. This allows tools to show event-specific payload contracts instead of a single generic `Object` payload.

## Recommended Dependency Choice

| Requirement | Dependency |
| --- | --- |
| Execute workflow services | `workflow-service` |
| Test workflow services with Cucumber | `cucumber-workflow-utils` |
| Generate or inspect workflow diagrams | `workflow-info`, `workflow-utils`, `stm-generate-puml` |
| Expose workflow MCP metadata | `workflow-mcp` |

This keeps normal workflow services focused on runtime behavior while MCP-aware services can opt into metadata support.
