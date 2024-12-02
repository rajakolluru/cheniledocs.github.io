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


