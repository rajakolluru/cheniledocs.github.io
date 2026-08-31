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

## How an extension is assembled

A workflow application normally has a base module and one or more extension modules. The base module owns the
stable flow name and standard path; extensions add only the variation they own. At runtime the STM reader merges
matching XML resources, then `ConfigBasedEnablementStrategy` can apply environment- or tenant-specific property
changes. Persistence selection is separate: the workflow service injects the base `EntityStore`, whose proxy
selects a suitable tenant/context/custom store for each declared store operation.

```text
base XML + extension XML resources with the same path
  -> merged STM descriptor
  -> optional ConfigProvider properties
  -> workflow transition
  -> base EntityStore proxy
  -> tenant -> context key -> custom strategy -> base store
```

Keep those concerns separate. XML determines workflow structure, properties make supported structural toggles,
and an `EntityStore` determines where the workflow entity is persisted. Do not use a tenant store to alter a flow,
and do not use a property overlay to introduce XML-only behavior such as entry actions.

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

### XML overlay checklist

1. Put the base and extension XML under exactly the same resource path and include both modules at runtime.
2. Reuse the base `flow` id and the existing `state` id when adding an outgoing transition to that state.
3. Give every new state and transition an unambiguous id; retain the base module as the owner of existing behavior.
4. Register extension transition-action beans in the extension module using the normal component/bean configuration.
5. Test the assembled application, not just each module alone, because resource loading and bean discovery happen in
   the combined classpath.

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

For tenant-specific properties, make the supplied `ConfigProvider` resolve configuration using the current tenant
context. The STM itself does not prescribe where configuration is stored; properties files, YAML, a configuration
service, and a tenant-aware database-backed provider are all valid implementations. Return no value for an absent
property so the base XML behavior remains in effect.

## EntityStore selection and tenant overrides

Workflow transition actions already support tenant-prefixed bean names. Workflow persistence now follows the same convention without changing the base workflow module.

For a base store bean named `vehicleEntityStore`, selection happens at each operation declared by
its `EntityStore` contract:

| Selection step | Selected store |
| --- | --- |
| Tenant is `tenant0` and `tenant0VehicleEntityStore` exists | `tenant0VehicleEntityStore` |
| No tenant store; a configured context key resolves a store | `<contextValue>VehicleEntityStore` |
| No tenant/context store; an application strategy resolves a store | Strategy-selected store |
| No selection applies | `vehicleEntityStore` |

Define tenant persistence in the tenant layer only:

```java
@Bean
EntityStore<Vehicle> tenant0VehicleEntityStore(Tenant0VehicleRepository repository) {
    return new Tenant0VehicleEntityStore(repository);
}
```

Only tenants that differ need a store bean. For example, with five tenants, defining only
`tenant2VehicleEntityStore` makes `tenant2` use that store while the other four continue using
`vehicleEntityStore`.

The resolver only accepts candidate beans that are `EntityStore` instances. A missing bean, a non-store bean, an
empty tenant/context value, or an empty strategy result moves to the next selection step. This makes it safe to
deploy one tenant-specific store without defining equivalent beans for every tenant.

### Extend the store contract

Do not add tenant-routable operations only to a concrete store class. Define an application
interface that extends `EntityStore` instead; all of its methods are discovered automatically.
This also means future methods added to `EntityStore` need no workflow-framework change.

```java
public interface VehicleEntityStore extends EntityStore<Vehicle> {
    void archive(Vehicle vehicle);
}

class DefaultVehicleEntityStore implements VehicleEntityStore { /* ... */ }
class Tenant0VehicleEntityStore implements VehicleEntityStore { /* ... */ }
```

When a selected tenant/context/custom store does not implement the interface that declares an
operation, that operation continues on the base store. Methods declared only on an implementation
class are helpers and always continue on that instance.

### Context-key selection

Configure existing `ContextContainer` keys in priority order after tenant lookup:

```properties
chenile.workflow.entity-store.context-keys=x-chenile-region-id,x-chenile-apt
```

With `x-chenile-region-id=apac`, the framework uses `apacVehicleEntityStore` when no
tenant-specific store exists. Common context keys include `x-chenile-region-id`,
`x-chenile-gid`, `x-chenile-apt`, and `x-chenile-tenanttype`.

### Application selection strategy

Use `EntityStoreSelectionStrategy` for rules that cannot be represented by a context-key prefix,
such as feature flags or entity/application-specific policies. Return an empty result to continue
to the next strategy or the base store.

```java
@Bean
EntityStoreSelectionStrategy premiumStoreSelection() {
    return baseStore -> isPremiumRequest()
        ? Optional.of("premium" + StringUtils.capitalize(baseStore))
        : Optional.empty();
}
```

Strategies run after configured context keys. Multiple strategies follow Spring `Ordered` priority.

`workflow-service` discovers this convention through Chenile's standard `org.chenile.configuration` component scan and class-proxies the base `EntityStore`, so existing `StateEntityServiceImpl`, `GenericEntryAction`, retrieval strategy, and body-type selector wiring continue to use the correct store. Base stores must be non-final if an application injects them by concrete class; interface injection has no additional constraint.

## Release and verification checklist

Before promoting an extension, verify the assembled runtime rather than only unit-testing its classes:

1. Load the base module and every enabled extension module together; confirm the expected states and transitions
   are present exactly once.
2. Exercise the base path and each extension path, including rejected/disabled transitions and cross-flow targets.
3. For each tenant, verify the active properties and the selected store with a create, process-by-ID, and retrieve
   flow. Include one tenant with no override to prove base fallback.
4. If a custom `EntityStore` subinterface is used, exercise its extra operation both where a tenant implements it
   and where selection falls back to the base store.
5. Keep an end-to-end Cucumber scenario with tenant context switching, so XML merge, property lookup, action
   selection, and persistence routing are validated together.

## Verify the extension

- Exercise both the base path and every extension path from its source state through its terminal state.
- Assert that disabled transitions are rejected and that target overrides reach the configured state.
- In a multi-tenant runtime, run the same workflow under each tenant context and verify configuration isolation.
- Verify create, process-by-ID, and retrieve calls use the tenant store when its prefixed bean is present and fall back to the base store otherwise.
- Keep an integration test that loads the base and extension modules together; this catches resource-path and component-wiring mistakes.

See the STM [configuration enablement tests](https://github.com/ajapros/chenile-core/tree/main/stm/src/test/java/org/chenile/stm/test/enablement) for executable property examples, and the [multi-tenant workflow extension sample]({{ '/developer/multitenant-workflow-extension/' | relative_url }}) for the XML-overlay pattern.
