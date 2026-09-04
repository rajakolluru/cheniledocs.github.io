---
title: Developer documentation
description: Practical Chenile guides for building and extending services.
permalink: /developer-docs/
---

# Developer documentation

These guides focus on implementing Chenile services and safely extending their runtime behavior.

## Workflow development

- [Extending STM workflows]({{ '/developer/stm-workflow-extension/' | relative_url }}) — choose between an XML overlay and configuration properties when a workflow must vary by module, tenant, or deployment.
- [Multi-tenant workflow extension sample]({{ '/developer/multitenant-workflow-extension/' | relative_url }}) — apply the XML-overlay pattern to a reusable vehicle workflow.

## JPA development

- [Numeric JPA identifiers]({{ '/developer/jpa-numeric-ids/' | relative_url }}) — use database-generated or application-generated Long and Integer IDs in ordinary JPA entities without changing workflow APIs.

## Start with the source

The runnable examples and framework source are the definitive implementation references:

- [Chenile core](https://github.com/ajapros/chenile-core)
- [Chenile samples](https://github.com/ajapros/chenile-samples)
