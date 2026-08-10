---
title: "Why microservices — and what they really cost"
short: "Why microservices"
order: 1
summary: "What we actually want from microservices, and the recurring tax every team pays when the same plumbing is rebuilt service by service."
---

## Start with the promise, not the pattern

"Microservices" is not a goal. It is a means to a handful of very concrete things engineering organizations want:

- **Independent deployability.** A change to the pricing service should not require re-testing and re-releasing the whole system.
- **Clear ownership.** A small team can own a service end to end — its data, its API, its on-call.
- **Blast-radius control.** When one capability fails or gets slow, the failure should be contained rather than cascading everywhere.
- **Independent scaling.** The parts under load scale without dragging the rest along.
- **Technology freedom, within reason.** Teams can evolve internals without a system-wide migration.

If you get those properties, you win — whether you deploy fifty services or run a single, well-partitioned **modulith**. Chenile deliberately supports both: the same service definitions can run together in one deployable during early stages, and be pulled apart later without rewriting business logic.

> The unit that matters is not the process boundary. It is the **service** — a contract with an owner. Microservices are just one way to deploy services.

## The tax nobody budgets for

Here is the pattern that plays out in almost every microservices program. The first service is a joy. By the tenth, something has gone wrong: every service has quietly grown its own copy of the same plumbing.

- Its own way of reading the authenticated user.
- Its own logging format and correlation-ID handling.
- Its own retry, timeout and idempotency logic.
- Its own tenant resolution.
- Its own request validation and error envelope.
- Its own i18n and message-bundle wiring.

None of this is business logic. All of it is **horizontal** — it cuts across every service. And because it was written inline, service by service, it is now inconsistent, hard to test, and impossible to change in one place. A security fix becomes a ten-repository pull request.

<div class="callout key">
  <div class="t">The real problem</div>
  Microservices multiply the number of places where cross-cutting concerns get re-implemented. The cost of microservices is rarely the services — it is the <strong>duplication of everything around them.</strong>
</div>

## Two questions that fix it

The rest of this story is the answer to two questions that, taken seriously, remove most of that tax:

1. **What actually *is* a service?** If a service is a *contract* rather than a codebase, we can separate the part consumers depend on from the part they must not. That is [part 2](/concepts/02-definition-vs-implementation/).
2. **Where does all the horizontal stuff go?** If cross-cutting concerns are named, packaged **policies** rather than inline code, we can write each one once and apply it everywhere. That is [parts 3](/concepts/03-service-policies/), [4](/concepts/04-policy-placement/) and [5](/concepts/05-how-chenile-helps/).

Chenile is the framework that takes both answers literally.
