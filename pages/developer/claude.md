---
layout: doc
title: Building Chenile with Claude
description: Install the Chenile plugin for Claude so that Claude knows Chenile's contracts and house rules, and uses JGen blueprints instead of improvising.
permalink: /developer/claude/
---

# Building Chenile with Claude

The [Chenile plugin for Claude](https://github.com/ajapros/chenile-claude-plugins) teaches Claude how Chenile works,
so the code it writes matches what the framework and its generator expect.

It contains five skills:

| Skill | Claude uses it when you… |
| --- | --- |
| `chenile-framework-knowledge` | write or review Chenile code, or build a UI or client against Chenile services. It covers the house rules, REST and response contracts, headers, workflow and query APIs, security, messaging, cconfig and admin endpoints. |
| `chenile-jgen` | generate services, workflows, queries, monoliths or process deployments with [JGen](https://jgen.chenile.org), or write and publish blueprints |
| `chenile-architecture` | need the internals: `ChenileExchange`, the interceptor pipeline, interpolations, service selection |
| `chenile-process-management` | build or run splitter/aggregator processes, workers, the outbox, triggers and cron |
| `chenile-query-workflow-blueprints` | work on the query and workflow (Finito STM) runtime |

## The house rules Claude follows

- **Tests:** always write Cucumber tests, reusing the steps in `cucumber-utils`.
- **Reuse:** use the existing Chenile utilities instead of writing new ones.
- **Imports:** import classes instead of writing fully qualified names in code.
- **Beans:** create them in `@Configuration` classes with explicit `@Bean` methods, not with `@Component`.
- **Modules:** split complex services into `-api` and `-service` modules.
- **Patterns:** look at the [JGen blueprints](/developer/jgen-blueprints/) first.

## Install

**Claude Code:**

```text
/plugin marketplace add ajapros/chenile-claude-plugins
/plugin install chenile@chenile-plugins
```

Claude then uses the skills on its own whenever your work matches. To get updates, run
`/plugin marketplace update chenile-plugins`.

**claude.ai and Claude desktop:**

1. Download the skill zips from the
   [repository's releases](https://github.com/ajapros/chenile-claude-plugins/releases), or build them with
   `scripts/package-skills.sh`.
2. Upload each one under **Settings → Capabilities → Skills**.

An organization owner can instead provision them for everyone.

## Suggesting it automatically across a team

The plugin's marketplace entry tells Claude Code when it is relevant:

- a `pom.xml` or Gradle build that depends on `org.chenile`;
- a JGen generation record or blueprint file being read;
- running `jgen` or `stm-cli`.

Claude Code then offers to install it, but only where an administrator has allowlisted the marketplace in
managed settings:

```json
{
  "extraKnownMarketplaces": {
    "chenile-plugins": { "source": { "source": "github", "repo": "ajapros/chenile-claude-plugins" } }
  },
  "pluginSuggestionMarketplaces": ["chenile-plugins"]
}
```

Contributions are welcome: see the repository's README.
