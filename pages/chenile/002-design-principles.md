---
title: Design Principles
keywords: chenile  Design Principles
sidebar: chenile_sidebar
toc: true
permalink: /chenile-design-principles.html
folder: chenile
summary: Chenile - Design principles
---

Chenile modulith framework works with a few  principles. They form the basis of its design patterns and blue prints. We will enumerate them below. 
##  Domain Driven Development
Chenile believes in a good domain driven design. The design of Chenile modules keeps them autonomous. Each Chenile module is envisaged to represent a bounded context. There are two code modules per bounded context - one to document the API and external facing model objects and the other to implement the API and for internal module objects. The latter is not consumed by the dependent services. 
## Code Modules
Chenile services are developed in independent code modules. Code modules are Maven modules.(We do want to incorporate JPMS at some point in time. However currently we equate code modules to Maven modules. )Code modules are packaged as jars. The jars contain code and configurations (including messsage bundles). Code modules do not contain the code that belongs to the dependencies. Hence Chenile code modules are not meant to be deployed. They are supplied as libraries.
## Code Packages - Mini Monoliths
Code packages are an assembly of code modules. The packages serve as a way to pack the code modules together with a main method. (typically the Spring Boot main method). Code packages contain all dependent code. They are packaged with the maven flatten plugin. Code packages can be deployed anywhere. Since packages don't contain code (other than the main() method which does nothing) they act as mere deployment containers. 
## De-coupling Development from Deployment
Code modules are owned by developers. Code packages are owned by SRE folks. (of course developers can be SRE's as well). Developers don't make any assumptions about the packages. SRE folks enforce their best practices on the packages and have full discretion to package code modules in different ways. For example they may decide to package two services s1 and s2 in the same package or they may decide to split the two into two different packages depending on requirements such as scalability, cohesion etc. By de-coupling packages from code modules, Chenile gives true independence to both developers and SRE's
## De-coupling Testing from Deployment
Code modules must be tested independent of their packaging. Test code must mock all dependencies and msut not make any assumptions on how the code modules will be eventually packaged. See [Chenile Test Strategy](/chenile-test-strategy.html) for more information.
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
The functionality of all services must be separated from the service policies. This is in accordance to the SOLID Single Responsibility Principle (SRP) and its reciprocal principle DRY (Don't Repeat Yourself). All service polices must be configured separately so that they can be applied at different levels by different components in the Chenile ecosystem. Service Policies must be configured as part of service metadata in a central service registry. See [Service Policies](/chenile-service-policies.html) for more details.
## Multi-Tenancy
Chenile believes in a design that facilitates multi-tenant architectures. See [our article on multi tenancy.](/chenile-multi-tenancy.html)
 

