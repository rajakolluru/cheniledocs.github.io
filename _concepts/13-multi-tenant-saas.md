---
title: "Multi-tenant SaaS, the Chenile way"
short: "Multi-tenant SaaS"
order: 13
summary: "One deployment, many customers. Chenile resolves the tenant once into a request context, then routes writes, reads and configuration per tenant — via multi-datasource-utils, Chenile Query and cconfig — so your business code stays tenant-agnostic."
---

## The SaaS problem

A SaaS product runs **one** codebase for **many** customers, each of whom must see only their own data and their own configuration — with strong isolation and no per-customer branches. The naive approaches (a deployment per tenant, or `if (tenant == …)` sprinkled through the code) don't scale.

Chenile's answer follows the pattern you've seen all along: **resolve the tenant once, put it in the context, and let the framework route everything else by configuration.** Your business logic never mentions the tenant.

## One resolution, everywhere

The tenant arrives on the request — typically the header `x-chenile-tenant-id` — and is resolved into the **`ContextContainer`**, the request-scoped context that Owiz propagates through the whole pipeline (and onward through [proxies](/concepts/09-registry-and-proxies/) and [messaging](/concepts/07-messaging-abstraction/)). From that single fact, three things route themselves. Pick a tenant:

<div class="jsx" data-jsx="tenant"></div>

## The three routings

**1 · Writes — `multi-datasource-utils`.** This `chenile-core` module registers a routing `DataSource` that selects the physical datasource from `ContextContainer.getTenant()`. You declare each tenant's connection under `chenile.multids`:

```yaml
chenile:
  multids:
    defaultTenantId: tenant1
    datasources:
      tenant1: { jdbcUrl: "jdbc:…/tenant1", username: sa, maximumPoolSize: 5 }
      tenant2: { jdbcUrl: "jdbc:…/tenant2", username: sa, maximumPoolSize: 5 }
```

JPA writes for a request automatically land in the right tenant's database — **database-per-tenant** isolation with zero routing code in your service.

**2 · Reads — [Chenile Query](/concepts/11-chenile-query/).** The query side is independently tenant-aware: a `QueryTenantResolver` plus `QueryDatasourcesProperties` point each tenant's searches at its own (often read-replica) query datasource. Same endpoint, isolated result sets.

**3 · Configuration — [cconfig](/concepts/08-configuration-management/).** Per-tenant settings are overrides keyed by a **custom attribute** = the tenant ID. One tenant can turn a feature on, change a limit, or rebrand a value while the shared base config stays clean.

## And per-tenant behaviour, too

Isolation isn't only about data. The [convention-based resolver](/concepts/09-registry-and-proxies/) can select a **tenant-specific bean** for an action or hook (via a context prefix like `x-tenant`), so one customer can have bespoke logic on a transition without forking the service. Security policies, run at the gateway and the last mile, enforce that a caller can only ever act within its own tenant.

<div class="callout key"><div class="t">The whole SaaS story in one line</div>
Resolve the tenant once into the <code>ContextContainer</code>; then <strong>writes</strong> route through <code>multi-datasource-utils</code>, <strong>reads</strong> through Chenile Query's tenant datasources, <strong>config</strong> through cconfig overrides, and <strong>behaviour</strong> through convention-resolved per-tenant beans — all while your business code stays completely tenant-agnostic.</div>

## Why teams choose Chenile for SaaS

<div class="split" style="margin-top:1.4em">
  <div class="panel good">
    <h3>✅ You get</h3>
    <ul>
      <li>Database-per-tenant isolation with no routing code</li>
      <li>Tenant-scoped reads, writes, config and behaviour</li>
      <li>One deployment, one codebase, many customers</li>
      <li>Tenant context that flows across HTTP, proxies and messages</li>
    </ul>
  </div>
  <div class="panel">
    <h3>🧩 The pieces</h3>
    <ul>
      <li><code>multi-datasource-utils</code> — write routing</li>
      <li><code>chenile-query</code> — read routing</li>
      <li><code>cconfig</code> — per-tenant configuration</li>
      <li><code>ContextContainer</code> + security — the tenant boundary</li>
    </ul>
  </div>
</div>
