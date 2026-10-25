---
title: "Polymorphism by configuration: the right code for each request"
short: "Polymorphism by configuration"
order: 16
summary: "In Chenile, which code runs is decided per request from data — a header, a tenant, a payload, a workflow state — not hard-wired. Service selectors, trajectories, interceptor interpolations, body-type selectors, workflow resolvers and MCP polymorphs are one idea seen from six sides. Here is how they fit, which to reach for, and how to keep late binding from failing late."
---

## One idea, many places

Object-oriented polymorphism picks behaviour by *type*: call `shape.area()` and the circle or the square answers. Chenile extends the idea to the request itself. **Which implementation runs, what type the input becomes, which workflow logic fires and which values apply are all decided per request, from data** — headers such as tenant or trajectory, the payload, the entity's state, configuration — and never by `if` statements in your business code.

That one idea shows up in several mechanisms that are usually documented separately. Seen together:

| What varies | Mechanism | Decided by |
|---|---|---|
| **Which implementation** serves a call | mock mode › [trajectory](/concepts/14-trajectories/) override › **`ServiceSelector`** › default bean | `x-chenile-mock-mode`, `x-chenile-trajectory-id`, or anything on the exchange |
| **Where** it runs | `ProxyTypeRouter` (`LOCAL`, `REMOTE`, or `COMPUTE_DYNAMICALLY`) | whether the target service lives in this mini-monolith |
| **Which interceptors** wrap it | **interpolations** in the `chenile-highway` pipeline; `bypassInterception` | the service, the operation, or anything on the exchange |
| **What type** the input becomes | `@BodyTypeSelector`; `SubclassBodyTypeSelector`; `StmBodyTypeSelector` | the operation, a top-level `"type"` discriminator, the workflow event |
| **Which logic** a workflow runs | `STMTransitionActionResolver` — transition actions, auto-states, post-save hooks | the event or state, the entity type, context headers such as tenant |
| **How it looks to an AI agent** | `@ChenilePolymorph` + a `ChenilePolymorphProvider` (e.g. `ProcessIdPolymorph`) | the operation's variants — one MCP tool each |
| **Which values** apply | [cconfig](/concepts/08-configuration-management/) overrides; workflow enablement | tenant, trajectory, configuration |

<p style="text-align:center;margin:2em 0"><img src="/assets/img/chenile-polymorphism.svg" alt="One request carrying tenant acme, trajectory t1 and the workflow event assign passes through five stages of the Chenile pipeline. At each stage one alternative is chosen from data: the interceptors (deployable, service, operation and a tenant-specific audit), the input type (AssignPayload), the implementation (mock off, trajectory has no override, the selector picks the premium bean), the location (local in-VM rather than remote), and the workflow action (acmeOrderAssign before orderAssign). Silent fallbacks, the default body type and the no-op default action, are marked. Below, one operation becomes one MCP tool per event, and a configuration value is overridden for tenant acme."></p>

Read it left to right: the same request takes a different path if you change its tenant, trajectory or event. The amber boxes are the fallbacks that [fail silently](#the-cost-of-late-binding--and-how-to-contain-it).

## Choosing the implementation

Every call — HTTP, event, proxy, scheduler, MCP — passes through the `constructServiceReference` step of the [interceptor pipeline](/developer/runtime-internals/). It resolves the implementation in a **fixed order**, and the first one that applies wins:

1. **Mock.** `x-chenile-mock-mode: true` (or a programmatic mock exchange) uses the service's mock bean.
2. **Trajectory.** If the request's trajectory overrides this service — declared with `@ConditionalOnTrajectory(id = "t1", service = "...")` — that bean runs.
3. **Service selector.** <span class="pill">2.1.35</span> If the service names a `ServiceSelector`, it inspects the exchange and returns a bean name; `null` means "no opinion".
4. **Default.** The service's `serviceName` bean.

```java
@ChenileController(value = "processWork", serviceName = "_processWorkService_",
                   serviceSelector = "processWorkServiceSelector")
public class ProcessWorkListener { ... }
```

The ordering is deliberate. A **trajectory** is an *external*, temporary experiment imposed on a slice of traffic; a **selector** is the service's *own*, permanent routing rule. When both apply, the experiment wins. Mocks beat everything so tests are never surprised.

Separately, a [proxy](/concepts/09-registry-and-proxies/) decides *where* the chosen service runs: `ProxyTypeRouter` keeps the call in-process when the target lives in the same mini-monolith (`COMPUTE_DYNAMICALLY`) and goes remote otherwise — the caller's code is identical either way.

## Choosing the input type

Polymorphic implementations usually take polymorphic inputs, so Chenile lets the body type vary too:

- **`@BodyTypeSelector("bean")`** on an operation runs a command that sets the exchange's body type before the JSON is parsed.
- **`SubclassBodyTypeSelector`** picks a subclass from a top-level `"type"` discriminator registered in `SubclassRegistry`. An unknown or unparseable discriminator is a 400 (`PAYLOAD_CANNOT_BE_PARSED`).
- **`StmBodyTypeSelector`** gives each workflow event its own payload type: it reads the second parameter of the resolved action's `transitionTo(...)`, or the event's `bodyType` metadata.

The [typed process work listeners](/developer/process-deployment-tutorial/) show the pairing at its clearest: a `ServiceSelector` picks the worker bean from the message's `processType` and `workerType` headers, and a body-type selector reads that worker's generic type so the payload arrives as the worker's own class.

## Choosing the interceptors

Polymorphism is not limited to the service. The **cross-cutting behaviour around it** — auth checks, auditing, rate limits, tenant handling — is also assembled per request, through **interpolations**.

The `chenile-highway` pipeline is an [Owiz](/developer/runtime-internals/) `FilterChain`, and a `FilterChain` does not hold a fixed command list. On **every execution** it walks its children, and when a child is an `InterpolationCommand` it does not run it: it calls `fetchCommands(exchange)` and splices whatever list comes back into that position. The interpolation is a placeholder that turns into zero, one or many interceptors **for this exchange**.

Chenile's highway has five of them:

| Interpolation | Expands to | Varies by |
|---|---|---|
| `exceptionHandlerInterpolation` | the configured exception handler (`chenile.exception.handler`) | deployable |
| `preProcessorsInterpolation` | `chenile.pre.processors` — runs before the body is typed or the service chosen | deployable |
| `postProcessorsInterpolation` | `chenile.post.processors` — runs after the service reference is chosen | deployable |
| `operationSpecificProcessorsInterpolation` | the operation's `interceptorComponentNames` / `@InterceptedBy` | **operation** |
| `serviceSpecificProcessorsInterpolation` | the service's `interceptorComponentNames` / `@InterceptedBy` | **service** |

So one pipeline definition yields a different interceptor stack for `orders.create` than for `invoices.list`, without either service knowing. And because expansion happens per exchange, an interpolation can choose by **anything on the exchange** — headers, tenant, trajectory, the chosen service reference. You can write your own: register it as a Spring bean (say `tenantInterceptorsInterpolation`) and add `<tenant-interceptors-interpolation/>` at the right point in a copy of the pipeline XML that `chenile.interceptors.path` points to:

```java
public class TenantInterceptorsInterpolation extends InterpolationCommand<ChenileExchange> {
    private final Map<String, List<Command<ChenileExchange>>> byTenant;   // a closed set
    private final List<Command<ChenileExchange>> standard;

    TenantInterceptorsInterpolation(Map<String, List<Command<ChenileExchange>>> byTenant,
                                    List<Command<ChenileExchange>> standard) {
        this.byTenant = byTenant; this.standard = standard;
    }

    @Override
    protected List<Command<ChenileExchange>> fetchCommands(ChenileExchange exchange) {
        String tenant = exchange.getHeader("x-chenile-tenant-id", String.class);
        return byTenant.getOrDefault(tenant, standard);   // e.g. extra audit for one tenant
    }
}
```

A finer-grained switch lives inside each interceptor: `BaseChenileInterceptor.bypassInterception(exchange)` lets an interceptor that *is* in the stack skip itself for a given request while still continuing the chain.

Two rules keep this safe. An interpolation's `fetchCommands` runs on every request, so keep it cheap and resolve beans **up front** (as above), not inside it. And an interpolation is never executed itself — if one is wired into a parent that does not expand interpolations, it fails with error 901 rather than being silently ignored.

## Choosing workflow logic

Inside a [Finito](https://thefinito.org) workflow, `STMTransitionActionResolver` finds the bean for an event (a transition action), a state (an auto-state computation) or a state entered (a post-save hook) **by name**:

```text
[context prefix] + <prefix> + [EntityType] + <EventOrState> + [Action | AutoState | PostSaveHook]
```

It tries, in order:

1. **Context-prefixed names** — when the resolver is built with extra prefix keys, it reads the matching `x-<key>` headers. The multi-tenant sample passes `chenile-tenant-id`, so tenant `acme` gets `acmeVehicleCreate` before `vehicleCreate`. Pass `chenile-trajectory-id` the same way to vary workflow logic per trajectory.
2. **Entity-qualified names** before plain ones, so one resolver can serve several entity types.
3. **The plain convention name**, e.g. `issueAssign` (or `issueAssignAction` with suffixes on).
4. **The default** — for a transition action, the resolver's default action; for an auto-state, an empty result; for a post-save hook, nothing.

Your states XML never changes; the variation lives entirely in bean names.

## Choosing how agents see an operation

With [MCP](/developer/mcp/) enabled, one Chenile operation can be published as **several tools**. `@ChenilePolymorph("bean")` names a `ChenilePolymorphProvider` that returns the variants. The workflow blueprints use `ProcessIdPolymorph`: the single `PATCH /{svc}/{id}/{eventID}` operation becomes one tool per event (`<prefix>_<event>`), each with the event fixed and its own typed payload — so an agent sees "assign", "resolve" and "close" as distinct, well-typed actions rather than one generic call.

## Which one to reach for

| You want to… | Use |
|---|---|
| Run an A/B test, canary or migration for a slice of traffic, then delete it | a **trajectory** |
| Route each request to one of several permanent implementations by something in the request | a **`ServiceSelector`** (plus a body-type selector if inputs differ) |
| Vary workflow behaviour by tenant, trajectory or entity type | **resolver prefixes** and convention-named beans |
| Accept a family of payload subclasses on one operation | **`SubclassBodyTypeSelector`** |
| Give agents a distinct tool per variant of one operation | **`@ChenilePolymorph`** |
| Add or drop cross-cutting behaviour (audit, limits, checks) for some services, operations or tenants | **`@InterceptedBy`** / `interceptorComponentNames`, or a custom **interpolation** |
| Change only a value — a limit, a flag, an endpoint | **cconfig** (or workflow enablement), not code |
| Make tests deterministic | **mock mode** |

## The cost of late binding — and how to contain it

Choosing code per request means some mistakes cannot be caught when the application starts. It helps to sort every mechanism by **when** a wrong configuration shows up:

| Mechanism | Checked at startup | When it is wrong at runtime |
|---|---|---|
| Default service bean | the bean, and every operation against its methods | — |
| `ServiceSelector` | the selector bean (must be a `ServiceSelector`, error 525) | the **chosen** bean is looked up and its method matched per request — the request fails (`NOT_CONFIGURED_IN_SPRING`, `UNKNOWN_METHOD`) |
| Trajectory override | the override beans are registered | the override's method is matched per request; an **unknown trajectory id silently falls through** to the selector or default |
| `SubclassBodyTypeSelector` | the registry | 400 for a bad discriminator |
| `StmBodyTypeSelector` | — | if no type can be derived it logs a warning and falls back to the operation's input type, so payload fields can be **silently dropped** |
| STM resolver | — | a misnamed action bean **silently runs the default action** — the generated one is a no-op, so the transition succeeds and the business logic is skipped; a missing post-save hook is skipped; lookup errors are swallowed |
| Service / operation interceptors | every named interceptor bean is looked up | — |
| `chenile.pre.processors` / `post.processors` / `chenile.exception.handler` | from 2.1.35, every name (error 526 / 527) | — (2.1.34 and earlier: looked up on first request; see the note below) |
| Custom interpolation | the interpolation bean, if the pipeline names it | whatever `fetchCommands` returns — an empty list means **no interceptors, silently** |
| Process work routing (queue) | — | the message fails → Kafka retries → dead-letter topic |

Deployable-wide pre- and post-processors and the exception handler are checked at startup from <span class="pill">2.1.35</span>: a misspelt name, or a bean that is not a Chenile interceptor, fails startup with error 526 or 527. In 2.1.34 and earlier they were looked up lazily, and a missing bean left a **partly built list cached**. The first request failed, and later requests ran only the processors resolved before the bad name. On those versions, check the names yourself in step 3.

That gives three classes: **loud at startup** (best), **loud at request time**, and **silent** (worst). Containment means pushing failures up that list.

### 1 · Make defaults loud, or make them truly correct

A fallback should be either *correct for every case it can receive* or *noisy*. Process management already does this: its `_processWorkService_` is a fallback that throws `NO_PROCESS_WORKER_SELECTED` rather than doing nothing. Apply the same rule to workflows: the generated `DefaultSTMTransitionAction` is the bean that runs whenever **no specific action matched**, so give it a voice — log and count `"no action for <event> on <state>"`, or throw for events you expect to have an action (keep an explicit allow-list for events that are genuinely pass-through).

### 2 · Close the set the selector can choose from

A selector that concatenates strings (`processType + "Executor"`) can name a bean that doesn't exist. Prefer a **closed map** — enum or configuration → bean name — and treat an unknown key as an explicit, clearly-coded error rather than a bean-not-found from deep in the pipeline. A closed set is also what makes step 3 possible.

### 3 · Re-create the startup check yourself

Chenile validates the default bean against every operation at startup; you can do the same for your candidates with the framework's own helpers. A small `ApplicationReadyEvent` listener:

```java
@Component
class SelectorWiringCheck {
    @Autowired ApplicationContext ctx;
    @Autowired ChenileConfiguration chenile;

    @EventListener(ApplicationReadyEvent.class)
    void verify() {
        List<String> problems = new ArrayList<>();
        ChenileServiceDefinition sd = chenile.getServices().get("processWork");
        for (String bean : candidateBeans()) {              // your selector's closed set
            if (!ctx.containsBean(bean)) { problems.add("missing bean " + bean); continue; }
            for (OperationDefinition od : sd.getOperations())
                if (MethodUtils.computeMethod(ctx.getBean(bean).getClass(), od) == null)
                    problems.add(bean + " cannot serve " + od.getName());
        }
        if (!problems.isEmpty()) throw new IllegalStateException("Selector wiring: " + problems);
    }
}
```

The same listener is the place to check the names in `chenile.pre.processors` and `chenile.post.processors` on releases before 2.1.35, and to call any custom interpolation once per tenant or trajectory you support and assert that the list it returns is the one you expect.

For process work, the candidates follow from the definitions: a leaf `processType` needs `<type>Executor`, a non-leaf needs `<type>Splitter` and `<type>Aggregator` — limited to the process types whose queues this worker monolith consumes. For workflows, list the flow's events (the service's `/{svc}/info/json` exposes them) and assert that each one you expect to carry logic resolves to a real bean, not the default.

### 4 · Validate the selector inputs at the edge

Late binding is driven by headers, so treat them as inputs. An unknown `x-chenile-trajectory-id` quietly falls through to normal resolution; an unknown tenant quietly misses its prefixed beans. Where a wrong value matters, check it early — an allow-list of trajectory ids, known tenants — in a pre-processor interceptor, so a typo becomes a clear 400 instead of the wrong behaviour.

### 5 · Test every branch, not just the default

Write tests that enumerate the variants: one scenario per trajectory, per tenant with prefixed beans, per `processType × workerType`, per workflow event. Chenile's BDD steps make this cheap, and the workflow services publish generated test cases at `/{svc}/info/test-cases`. A parameterised test over the closed set from step 2 is the runtime twin of the startup check in step 3.

### 6 · Make the choice observable

After `constructServiceReference`, `exchange.getServiceReferenceId()` names the bean that was chosen. Log it with the trajectory and tenant, emit a metric per chosen bean, and alert on the signals that mean "the default caught something": the default STM action firing, the process-work fallback, dead-letter topic depth. Silent failures stop being silent when someone is counting them.

### 7 · Keep asynchronous failures recoverable

On queues, a misrouted message must not vanish. Chenile's Kafka consumer retries and then parks the message on a dead-letter topic (`<topic>.DLT`); provision those topics, alert on them, and once the wiring is fixed the parked messages can be replayed.

<div class="callout"><div class="t">Where to look</div>
<code>Chain</code>, <code>FilterChain</code> and <code>InterpolationCommand</code> in <code>owiz</code>; the five interpolations under <code>org.chenile.core.interceptors.interpolations</code>, <code>BaseChenileInterceptor</code>, <code>ConstructServiceReference</code>, <code>ServiceSelector</code>, <code>@ConditionalOnTrajectory</code>, <code>SubclassBodyTypeSelector</code> and <code>MethodUtils</code> in <code>chenile-core</code>; <code>ChenilePolymorph</code> in <code>chenile-mcp</code>; <code>ProxyTypeRouter</code> in <code>chenile-proxies</code>; <code>STMTransitionActionResolver</code>, <code>StmBodyTypeSelector</code>, <code>DefaultPostSaveHook</code> and <code>DefaultAutomaticStateComputation</code> in <code>workflow-service</code>; <code>ProcessIdPolymorph</code> in <code>workflow-mcp</code>; <code>ProcessWorkServiceSelector</code> and <code>ProcessWorkBodyTypeSelector</code> in <code>process-delegate</code>. Working examples: <code>s1</code> / <code>s1-t1-service</code> (trajectories) and the multi-tenant vehicle sample (tenant-prefixed workflow beans) in <code>chenile-samples</code>.</div>
