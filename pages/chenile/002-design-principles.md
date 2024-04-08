---
title: Design Principles
keywords: chenile  Design Principles
sidebar: chenile_sidebar
toc: true
permalink: /chenile-design-principles.html
folder: chenile
summary: Chenile - Design principles
---

Chenile works with a few  principles. They form the basis of its design patterns and blue prints. We will enumerate them below. 
##  Domain Driven Development
Chenile believes in a good domain driven design. The design of Chenile modules keeps them autonomous. Each Chenile module is envisaged to represent a bounded context. There are two code modules per bounded context - one to document the API and external facing model objects and the other to implement the API and for internal module objects. The latter is not consumed by the dependent services. 
## Message Driven
Chenile fundamentally deals with messages as opposed to the normal request-response paradigm. Messages are mutated as they navigate different commands. This paradigm is compatible with SEDA (Staged Event Driven Architecture) and similar paradigms. 
Message driven architecture supports Message Queues, Kafka events etc. and is easily convertible to a normal request-response paradigm.
## SOLID Principles - OCP (Open Close Principle)
Chenile believes in creating extensible designs using OCP (Open Closed Principle). Most of Chenile designs are configuration driven. Chenile base classes have well known extension points.
## SOLID Principles - DIP (Dependency Inversion Principle)
DIP states that higher level modules must not depend on lower level modules. They must instead rely on interfaces exposed by the lower level modules. Chenile advocates the separation of interfaces (API) from Implementations into different code modules. Consumers of a service must depend on the API module (which contains interfaces and contracts) and not the service module (which contains the Implementation details)
## State Centric Mutations
Chenile considers workflow entities to be goverend by their state. All mutations of state entities are determined by their current state. For example an Order entity can be Closed (i.e. the Close event can be sent to it) only if its current state is Opened or Fulfilled. Hence events that can happen in the life of an entity are tied to its state. Chenile uses its state machine to govern the mutation of all its workflow entities.
## Service Policies
The functionality of all services must be separated from the service policies. This is in accordance to the SOLID Single Responsibility Principle (SRP). All service polices must be configured separately so that they can be applied at different levels by different components in the Chenile ecosystem. Service Policies must be configured as part of service metadata in a central service registry. See [Service Policies](/chenile-service-policies.html) for more details.
 

