---
title: Domain Driven Design
keywords: homepage
tags: [domain introduction modulith chenile]
sidebar: chenile_sidebar
permalink: /domain-definition.html
summary: What is the basis for identifying a DDD domain?
---

## Identifying Bounded Contexts
In Domain Driven Design, the entire problem space is divided into Bounded contexts. Each bounded context 
has salient entities or aggregates. Each bounded context is responsible for a set of aligned operations 
that relate to the chief entity of the bounded context. The bounded contexts collaborate to solve 
the problem space for the organization. 

Bounded contexts are vertical slices of the functionality. So how do we identify bounded contexts in 
the domain? How do we segment functionalities across bounded contexts? The following section attempts 
to answer these questions.

## Entity Alignment with Bounded Contexts

The SOLID Single Responsibility Principle (SRP) manifests itself as a master data rule i.e. one 
entity must be be the responsibility of one bounded context. Hence, many of the chief bounded contexts
can be identified roughly using key entities of the domains. Entities can also be grouped together if
they are cohesive enough. 

If any functionality is substantial enough, it requires a proper domain model. Hence bounded contexts
will typically support a domain model. However, there may be smaller bounded contexts that are bundled 
as libraries, SDKs, Integration proxies. 

## Higher Level Constructs

Higher level constructs such as application journeys, BFF orchestrations, Business Rules etc. require
the orchestration between multiple bounded contexts. These are modeled as higher order orchestration
services. 

## Non Functional Requirements (NFRs)
NFRs are implemented as horizontal services. They span across multiple bounded contexts. NFRs are 
implemented as a service in their own bounded contexts. However, they are also available as either
SDKs or common libraries that can be called from other bounded contexts. E.g., Security 

Typically, NFRs have an interceptor that can be used by other services to implement the NFR. For example
we have Security interceptors that are available as Servlet Filters, Aspect Oriented Programming (AOP)
advices etc. 

## Features of a Bounded Context
All bounded contexts in a domains have the following traits:
1. Bounded contexts map to real-world entities and features. Hence, they should be mappable to real world entities without an elaborate mapping exercise.
2. Bounded contexts are cohesive. They contain entities that depend on each other to solve a bigger problem.
3. Bounded Contexts are 'atomic'. If a domain is split further, then the problem that gets solved will be so negligible as to be practically useless.
4. Bounded contexts are about "nouns" and seldom about verbs. For example, a real world workflow progressively enhances an entity (or a set of related entities that might represent an Aggregate). Hence the entity (and not the workflow) would be the subject of the bounded context.



