---
title: Extending STM workflows
description: Choose and implement XML-overlay or properties-based extensions for Chenile STM workflows.
permalink: /developer/stm-workflow-extension/
---

# Extending STM workflows

Chenile STM supports two complementary ways to extend an existing workflow:

1. Add an XML overlay from an extension module when the workflow structure is part of that module.
2. Apply configuration properties when the variation is deployment- or tenant-specific and only needs manual states, transitions, visibility, or routing changes.

Use XML for richer state-machine definitions. Use properties for lightweight, configurable variations of an established flow.

| Need | Recommended mechanism |
| --- | --- |
| Add a packaged workflow path with actions, auto states, custom tags, or state-level configuration | XML overlay |
| Add a basic manual state or transition for a tenant/deployment | Configuration properties |
| Hide a state or transition | Configuration properties |
| Redirect an existing transition | Configuration properties |
| Change transition actions or define an automatic state | XML overlay |

## Option 1: XML overlay from a second module

Keep the base workflow and extension workflow in separate modules, but give both XML resources the **same classpath name**. `XmlFlowReader#setFilename` reads every classpath resource matching that name. When an extension declares the same flow or state ID, the reader uses the existing descriptor and adds its declarations to it.

Base module resource: `com/mycompany/myorg/vehicle/vehicle-states.xml`

```xml
<states>
  <flow id="VehicleFlow" default="true">
    <manual-state id="OPENED" initialState="true">
      <on eventId="assign" newStateId="ASSIGNED"/>
    </manual-state>
    <manual-state id="ASSIGNED">
      <on eventId="resolve" newStateId="RESOLVED"/>
    </manual-state>
    <manual-state id="RESOLVED">
      <on eventId="close" newStateId="CLOSED"/>
    </manual-state>
    <manual-state id="CLOSED"/>
  </flow>
</states>
```

Extension module resource at the identical path:

```xml
<states>
  <flow id="VehicleFlow">
    <manual-state id="ASSIGNED">
      <on eventId="ext" newStateId="EXTENSION"/>
    </manual-state>
    <manual-state id="EXTENSION">
      <on eventId="close" newStateId="CLOSED"/>
    </manual-state>
  </flow>
</states>
```

The extension can contribute an action bean for `ext` using the normal transition-action resolver convention. Avoid defining conflicting values for the same flow/state/transition in more than one resource: classpath resource order is not a useful precedence contract.

The runnable vehicle example is in [chenile-samples](https://github.com/ajapros/chenile-samples/tree/main/how_to_extend_chenile_service). Its base and extension modules both provide `com/mycompany/myorg/vehicle/vehicle-states.xml`.

## Option 2: configuration-based extension

Enable `ConfigBasedEnablementStrategy` in the base XML and provide it as a component. The strategy obtains values through the STM `ConfigProvider` interface, so an application can back it with properties, YAML, tenant configuration, or another configuration source.

```xml
<states>
  <enablement-strategy componentName="configBasedEnablementStrategy"/>
  <flow id="VehicleFlow" default="true">
    <!-- existing states -->
  </flow>
</states>
```

The minimal component wiring is application-specific; it must expose a `ConfigBasedEnablementStrategy` built with a `ConfigProvider` that implements both `valueOf(name)` and `getProperties(prefix)`.

```java
@Bean
ConfigBasedEnablementStrategy configBasedEnablementStrategy(
        ConfigProvider workflowConfigProvider) {
    return new ConfigBasedEnablementStrategy(workflowConfigProvider);
}
```

For a flow called `VehicleFlow`, these properties add an extension state and path, disable an existing transition, and redirect another transition:

```properties
# Add a manual state. The value is not used.
VehicleFlow.state.add.EXTENSION=

# Add ASSIGNED --ext--> EXTENSION and EXTENSION --close--> CLOSED.
VehicleFlow.ASSIGNED.transition.add.ext=EXTENSION
VehicleFlow.EXTENSION.transition.add.close=CLOSED

# Disable an existing transition or state only when explicitly false.
VehicleFlow.ASSIGNED.resolve.enabled=false
VehicleFlow.RESOLVED.enabled=false

# Change an existing transition target. Use OtherFlow.STATE for another flow.
VehicleFlow.ASSIGNED.close.newStateId=CLOSED

# Add metadata to a generated transition or state when needed.
VehicleFlow.ASSIGNED.ext.meta.mainPath=true
VehicleFlow.EXTENSION.meta.label=Tenant extension
```

A missing `*.enabled` property means the state or transition remains enabled. `state.add` produces a manual state only; properties do not provide actions, auto-state computation, custom XML tags, entry/exit actions, or other rich descriptor settings. Use an XML overlay for those cases.

## Verify the extension

- Exercise both the base path and every extension path from its source state through its terminal state.
- Assert that disabled transitions are rejected and that target overrides reach the configured state.
- In a multi-tenant runtime, run the same workflow under each tenant context and verify configuration isolation.
- Keep an integration test that loads the base and extension modules together; this catches resource-path and component-wiring mistakes.

See the STM [configuration enablement tests](https://github.com/ajapros/chenile-core/tree/main/stm/src/test/java/org/chenile/stm/test/enablement) for executable property examples, and the [multi-tenant workflow extension sample]({{ '/developer/multitenant-workflow-extension/' | relative_url }}) for the XML-overlay pattern.

