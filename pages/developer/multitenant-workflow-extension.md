---
title: Multi-tenant workflow extension sample
description: A Chenile sample that combines reusable workflows with tenant-specific actions and models.
permalink: /developer/multitenant-workflow-extension/
---

# Multi-tenant workflow extension sample

The `how_to_extend_chenile_service_multitenant_pubsub` sample demonstrates a reusable `vehicle` workflow with independent `tenant0` and `tenant1` extensions in one JVM.

It keeps the core workflow in the `vehicle` module and gives each extension module its own subtype, transition action, and `vehicle-states.xml` resource. The matching resource path allows the extension XML to add an `ASSIGNED --ext--> EXTENSION --close--> CLOSED` path without modifying the core module.

Tenant-specific action resolution uses the request tenant header, while `chenile.http.extension-subtypes` selects the appropriate entity subtype. The packager module loads both tenant modules and verifies their workflows, datasource routing, and pub/sub behavior together.

Read [Extending STM workflows]({{ '/developer/stm-workflow-extension/' | relative_url }}) for the XML-overlay mechanics, when to choose properties instead, and the supported property syntax.

## Run the sample

```bash
git clone https://github.com/ajapros/chenile-samples.git
cd chenile-samples/how_to_extend_chenile_service_multitenant_pubsub
mvn -pl custom-tenant0/service -am test
mvn -pl custom-tenant1/service -am test
mvn -pl packager/service -am test
```

See the complete [sample README](https://github.com/ajapros/chenile-samples/tree/main/how_to_extend_chenile_service_multitenant_pubsub) for module layout, tenant configuration, and Cucumber scenarios.

