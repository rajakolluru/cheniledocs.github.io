---
title: Workflow MCP Support
keywords: chenile workflow mcp polymorph processById
sidebar: chenile_sidebar
toc: true
permalink: /workflow-mcp.html
folder: chenile
summary: Optional MCP metadata support for Chenile workflow services
---

# Workflow MCP Support

`workflow-service` is the runtime implementation for Chenile workflow services. It does not require MCP.

If a service wants to expose workflow operations as MCP metadata, add the optional `workflow-mcp` module. This keeps normal workflow services small while still allowing MCP-aware services to attach metadata support.

## Dependencies

Use `workflow-service` for workflow execution:

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>workflow-service</artifactId>
  <version>${chenile.query.workflow.blueprints.version}</version>
</dependency>
```

Add `workflow-mcp` only when the service exposes workflow MCP metadata:

```xml
<dependency>
  <groupId>org.chenile</groupId>
  <artifactId>workflow-mcp</artifactId>
  <version>${chenile.query.workflow.blueprints.version}</version>
</dependency>
```

`workflow-mcp` depends on `workflow-service` and `chenile-mcp`. Applications that do not need MCP should not add it.

## Process ID Polymorph

Workflow `processById` operations are polymorphic because different events can require different payload types.

`workflow-mcp` provides:

```java
org.chenile.workflow.service.stmcmds.ProcessIdPolymorph
```

The class reads event payload metadata from `StmBodyTypeSelector` and creates one MCP variant per workflow event. Each variant contains:

- a name suffix based on the configured prefix and event id
- the event description
- the payload parameter type
- a fixed event parameter value
- a payload parameter description

This allows MCP tooling to represent event-specific workflow calls instead of treating all `processById` calls as one generic method.

## Runtime Split

The module split is intentional:

| Module | Purpose |
| --- | --- |
| `workflow-service` | Workflow runtime, STM processing, actions, retrieval, allowed actions |
| `workflow-mcp` | Optional MCP metadata bridge for workflow operations |

This means a generated or hand-written workflow service can depend on `workflow-service` by default. Add `workflow-mcp` only for MCP contracts, tools, or introspection.
