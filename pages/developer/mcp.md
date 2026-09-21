---
layout: doc
title: MCP — Chenile services as AI tools
description: Expose Chenile services, workflows and queries to AI agents over the Model Context Protocol, reusing the same operation metadata Chenile already has.
permalink: /developer/mcp/
---

# MCP — Chenile services as AI tools

Chenile already knows a great deal about each service: its operations, their parameters and body types, and their metadata. `chenile-mcp` reuses that to expose Chenile operations to AI agents over the **Model Context Protocol (MCP)** — so a service can be *called by a model* the same way it is called over HTTP or a proxy, and behind the same [interception pipeline](/concepts/10-owiz/).

## What it does

`chenile-mcp` (in `chenile-core`) turns Chenile operations into MCP **tool callbacks**. Its `ChenileMCPInitializer` discovers eligible operations and registers them; `ChenileToolCallback` adapts a Chenile operation to an MCP tool, and the model classes (`ChenileMCP`, and the `ChenilePolymorph` / `ChenilePolymorphProvider` / `ChenilePolymorphVariant` types) describe polymorphic payloads so tools with type hierarchies are represented correctly to the agent.

Because the tool call enters the normal pipeline, **your security, tenancy, logging and validation policies apply to agent calls automatically** — you don't get a second, unguarded door for AI traffic.

## Workflows and queries too

The blueprint layer adds MCP for higher-level patterns:

- **`workflow-mcp`** — exposes a [workflow](/concepts/06-bdd-testing/) service's operations (and its introspection metadata) as MCP tools, so an agent can drive a state machine's transitions.
- **`query-mcp`** — exposes a [Chenile Query](/concepts/11-chenile-query/) service, so an agent can run metadata-driven searches with the same filter/sort/paginate contract, no bespoke tool code.

## Why it matters

You describe a service once, in Chenile's usual way, and it becomes reachable by REST, by proxy, by message — and now by an AI agent — with identical governance. MCP support is **opt-in**: add the module and enable it for the operations you want an agent to see, and keep everything else private.

<div class="callout"><div class="t">Where to look</div>
Engine: <code>org.chenile.mcp</code> in <code>chenile-core/chenile-mcp</code> (<code>ChenileMCPInitializer</code>, <code>ChenileToolCallback</code>, the <code>ChenilePolymorph*</code> model). Blueprints: <code>workflow-mcp</code> and <code>query-mcp</code> in <code>chenile-query-workflow-blueprints</code>. A service generated with the <code>chenile-service</code> blueprint can enable MCP support at generation time (the <code>enableMCP</code> option).</div>
