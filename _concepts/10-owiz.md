---
title: "Owiz: the orchestration engine that powers Chenile"
short: "Owiz orchestration"
order: 10
summary: "Under Chenile's interception pipeline sits Owiz — a tiny, framework-agnostic Orchestration Wizard. Commands enrich a shared context; chains, routers, splitter-aggregators and parallel blocks compose them into flows."
---

## What actually runs the pipeline

Throughout this story we've talked about the *interception pipeline* — policies running around a service ([part 3](/concepts/03-service-policies/)), the same abstraction at the gateway and the last mile ([part 5](/concepts/05-how-chenile-helps/)), even the client side ([part 9](/concepts/09-registry-and-proxies/)). All of it is built on one small engine in `chenile-core`: **Owiz**, the *Orchestration Wizard*.

Owiz is a command-orchestration library in the spirit of the classic *Chain of Responsibility* and the Enterprise Integration Patterns. Chenile uses it to disintermediate traffic — to run the same orchestrated flow regardless of whether a request arrived over HTTP, as a message, or through an in-VM proxy call.

<div class="callout key">
  <div class="t">The core idea</div>
  A <strong>Command</strong> does one thing to a mutable <strong>Context</strong>. Owiz composes commands into flows — sequential chains, conditional routers, scatter-gather splitters, parallel branches — configured in XML or built programmatically. That composition <em>is</em> Chenile's interception pipeline.
</div>

## Commands and the context

Everything in Owiz is a `Command<C>` with a single method — it receives the context and enriches it:

```java
public class SimpleCommand implements Command<BaseContext> {
    public void execute(BaseContext ctx) {
        ctx.put(commandId, "owiz");
        ctx.invocationOrder.add(commandId);   // progressively enhanced
    }
}
```

The **context** is a mutable object passed down the flow; each command reads what earlier commands wrote and adds its own contribution. In Chenile the context is the `ChenileExchange`, and each interceptor is a command.

## The building blocks

Owiz gives you a handful of composable primitives. Click through them:

<div class="jsx" data-jsx="owiz"></div>

- **Chain** — run commands in order; the backbone of the interception pipeline.
- **Router** — choose the next command by evaluating an OGNL condition on the context (`OgnlRouter` / `EvaluateRouter`).
- **Splitter–Aggregator** — fan a collection out, process each item, and combine the results (scatter-gather).
- **Parallel chain** — run independent commands concurrently and join.
- Plus `FilterChain`, `ForLoop`, `DelegatorCommand`, `InterpolationCommand` and `DoNothing` for the edges.

## Configured, not hard-wired — and framework-agnostic

Flows are assembled by an `XmlOrchConfigurator` (XML) or built in code, so the *shape* of an orchestration is configuration. And Owiz is deliberately **not** tied to Spring: by default it works with any bean factory. Point it at Spring with a single adapter:

```java
// Make Owiz resolve commands from the Spring context.
new OwizSpringFactoryAdapter(applicationContext);
// ...but drop this, and Owiz runs happily with a plain bean factory.
```

That independence is why the same engine powers the [STM](/concepts/06-bdd-testing/) actions, the interception pipeline, and the proxy client-processor chain — and why you can embed Owiz on its own.

## Why it matters

Because policies are Owiz commands in a chain, everything you've read composes: adding a policy is adding a command; changing where it runs is re-composing the flow; routing by tenant or channel is a router; scatter-gather across shards is a splitter-aggregator. One small, testable orchestration core, reused everywhere Chenile moves a request.
