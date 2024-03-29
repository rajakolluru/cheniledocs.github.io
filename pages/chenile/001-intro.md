---
title: Introduction to Chenile Framework
keywords: chenile  Introduction
sidebar: chenile_sidebar
toc: true
permalink: intro.html
folder: chenile
summary: Chenile Introduction
---

# Chenile Framework


The Chenile framework provides comprehensive backend capabilities. 

Here are its chief features:

## Declarative Configuration
Chenile offers declaration configuration abilities. The service is implemented as a POJO (Plain Old Java Object). All service policies and transports are configured separately. This decouples the service from its deployment. Chenile services can be configured in the following ways:
- **Spring Rest Controller** - Use a spring rest controller to configure the HTTP end point to the service as usual. Annotate that using Chenile annotations to enable last mile interception capabilities. 
- **Configuration JSON** - JSON configuration can be used if Spring controller is not required. 

The configuration includes the following information:

### Transport specification 
Chenile allows the developers to configure different types of transports. The transports provide the bindings to expose the service. Transport configurations exist for HTTP, Kafka, Batch Processing and Scheduling. The same service executes irrespective of the transport end point. 

### Service Policies
Chenile enables comprehensive interception capabilities. Services can be intercepted at the API Proxy layer or even in the last mile (i.e. the interceptors are bundled with the service). Service policies configured using Chenile declarative configuration, can be used by the interceptors to provide various features. For example, a rate limiting interceptor can use sevice specific rate limiting policies.

## Faster time to market
Chenile's chief focus is to considerably expedite the time to market. To this end, it focuses on time-saving features that include the following:

### Code generation
Chenile ships with CLI's that allow developers to generate both frontend and backend stubs. These include the following features:
- Adherence to coding guidelines
- Auto generation of service, models etc.
- A testing harness with a representative test case
- Configuration to deploy the service to WCNP
- Dev/Ops enabled services with looper integrated

### Design Patterns
Chenile documents a few design patterns. (more to come on this)

Chenile provides blue print accelerators to implement these patterns.

## Dependency Management
Chenile provides comprehensive dependency management features. It standardizes the dependency versions of all the libraries using Spring boot. Chenile dependencies are also standardized. Every service has to include the correct version of Chenile framework. The rest of the dependencies flow from there. 

### Aurora Versioning
Chenile recommends a few patterns around framework versioning. All services can leverage the comprehensive versioning features provided by git (using git tags). Maven has adopted specific variables such as _revision_ which can be used to specify the version that is released. This shifts the burden of maintaining version information to git.

### Depedency Manifest
Eventually, Chenile will create a dependency manifest for all services. This can help in multiple ways:
1. Services can only be released in accordance with the dependency manifest. If Version 1 of service1 depends on version 2 of service2 then these two must be released together. The build process will enforce this behavior

## Consistency
Chenile considers consistency as instrumental for maintainability of the code base. Consistency also guarantees that the same tech stack (with the same versions of different dependencies) is used throughout Walmart. To this end, it standardizes the tech stack 

Code structure is also standardized so that developers would know where to look to find particular artifacts such as Spring configurations, services, models etc. This can result in considerable developer fungibility.

## Federated Development
Chenile allows for a federated development model. All services are modularized and discovered during runtime. All subapps on the UI side are also discovered during runtime by the App Shell. This leads to considerable organizational flexibility. 

Chenile also provides extension points for subapps and services to extend the functionality. These extension points allow region specific services (for example) to leverage common services. 

## Object Model
All shared entities in Chenile will comply to a standard domain model. This can unify the language that is used to depict entities such as Order, Item, Offer etc. The object model is published from Aurora SDKs which allow the applications to communicate seamlessly to backend resource tiers such as OMS, IQS etc.

## Event Model
Chenile also envisages a common published event model to advertise changes to key Walmart entities.

## Reusable Libraries
Chenile provides reusable libraries that can expedite application development.
* **State Transition Machine** See [here](stm)
* **Orchestration engine** See [here](orch)

## NFRs
A big part of application development is about the consistent application of NFRs. Chenile de-couples service policies from the service implementation. Policies are hooked to the service while the service is being deployed. This enables the following capabilities:
* **Single Responsibility Principle (SRP):** The NFR code stays separate from the service code
* **Consistent application** - NFRs are implemented consistently 
* **Service Specific Policies** - Service configurations specify the NFR policy. This allows customization of the NFRs according to individual services. 

## Chenile Proxy
Chenile extends the notion of service mesh and makes it part of the VM. The Aurora proxy allows the developers to write code that is agnostic to the location of a service's dependency. For example, if service1 depends on service2 then the developer can directly invoke service2 by merely knowing its interface. The proxy framework abstracts the complexity of talking to the remote service. If service2 is co-deployed with service1 in the same mini monolith, then Aurora will invoke the local proxy. Else it will invoke a remote HTTP based proxy.






