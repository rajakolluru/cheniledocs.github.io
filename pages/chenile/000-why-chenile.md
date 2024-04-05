---
title: "Chenile Modulith Framework -  Micro Services done right! "
keywords: homepage
tags: [getting_started introduction modulith]
sidebar: chenile_sidebar
permalink: /why-chenile.html
summary: Why Chenile? We discuss the rationale here for a framework and how Chenile can help.
---

{% include note.html content="An introduction to Chenile. Want to use it write away? Go to <a href='app-gen-landing-page.html'>set up page</a>" %}

# Motivation 
Micro services have become the prevalent paradigm for development. We could create autonomous teams with segmented responsibilities. Each team knows its respective domain and builds services in them. All the teams collaborate to create an ecosystem that can accomplish complex tasks with aplomb. 

As one of the most popular server side programming languages, Java is a language of choice to implement Micro Services. Especially, with Spring Boot, it is a cinch to create new micro services. Developers have access to multiple frameworks that can be used to implement all the concerns of Micro services. 

Therefore, we do need a strong justification to add another new framework into the fold. 

<a name='thewhat'/>
# Why do we need a framework?
In our experience of working for over three decades in application development with companies of all sizes, we have observed a few things that most organizations struggle with. We discuss these concerns in the following sections. We also discuss how Chenile solves these problems 

# Autonomy & Cohesion
Companies struggle with de-coupling teams. Afterall, the essence of Agile development is the concept of strong self-organizing teams. These teams need to come together to assemble an ecosystem that works for the company. This ecosystem needs to function cohesively to accomplish the requisite functionality. So it is a balance between autonomy and cohesion. We want a framework and development platform that caters to these dual (but mostly conflicting) concerns. 

Domain Driven Design (DDD) divides the functionality into Bounded Contexts (BC). We need to think about companies - from large enterprises to startups - as comprising of smaller autonomous companies with each one of these responsible for a bounded context. Each bounded context(BC) has clearly defined contracts that it exposes to other bounded contexts within the enterprise. In fact it is possible that the same BC can function autonomously across enterprises. For example think about AWS. What was an erstwhile Amazon Bounded context has become a global one that others can reuse. Hence each bounded context has the potential to spawn into a new company. 

How do we make sure that a bounded context is given the requisite autonomy without compromising the overall cohesion that is required to build a stable and sustainable ecosystem? 

Look at the autonomy pyramid shown below:

![Autonomy vs. Cohesion Balance](images/chenile/autonomy.png)

As we see, the greater the concerns that are independent, the more autonomous the BCs become! But greater autonomy also decreases cohesion and the potential for reuse. We advocate a good amount of autonomy but discourage the type of autonomy that decreases governance (which in turn is counter productive for cohesion). Our recommendations are shown in the diagram. The reasons are given below:

| S. No. | Feature  | Our recommendation | Justification | How does Chenile help? |
|--------|--------|-----------------------------------|------------------------|
| 1|Backlog | Y | A healthy independent backlog is vital for autonomy | Chenile helps in building features independently |
| 2|Codebase | Y | Code must be modular and autonomous. Yet it must expose the correct interfaces for others to consume| Chenile generator generates code that complies to Dependency Inversion Principle.|
| 3|Database | Y | Databases must evolve independently. Yet they should expose "aggregates" as recommended by DDD for others to consume | Chenile recommends to use Java JPA and Mybatis. Please see the section about the usage of the CQRS pattern (Command Query Responsibility Separation) |
| 4|Validation | Y | It should be possible to validate code independent of other groups. Else it becomes too hard to evolve autonomously | Chenile generates an entire test harness based on Spring MVC and Cucumber for BDD. |
| 5|Deployment | To an extent | Deployment autonomy is often overhyped. It causes more harm than good. It is a good idea to pack together a bunch of services and deploy them together. However, every micro service must not be independently deployed. It increase the complexity for observability and deployment| Chenile advocates the Mini Monolith pattern which is discussed below |
| 6|Architecture / Tech Stack | N | In general, Architectural and Tech Stack divergence increases complexity and decreases the ability to standardize and reuse software | Chenile provides common libraries and tech stack standardization by having a common Maven POM. | 

# Architectural / Tech Stack Standardization
All Chenile services must be written as independent maven modules that are brought together in a package. These services will leverage a common parent pom which in turn inherits from (chenile-parent) which lastly inherits from the spring boot parent pom. Thus the entire tech stack is standardized and specified in one place. The correct versions must be defined at the parent pom level and not at the service level. 

Chenile also standardizes the architecture and provides an interception framework that is common across all services. This is discussed in greater detail [in this section on last mile interception](last-mile-interception.html). 

There are more details in the pages around the need for API Gateways, Service Registries etc. (TODO we will add these links soon in this page)

DevOps is an important part of enforcing architecture. It is discussed [in separate pages.](chenile-devops.html)

# Deployment Strategy - Mini Monoliths
Chenile introduces the concept of a mini monolith. A mini monolith is a package that deploys one or more modular services. It takes the jars from a bunch of services and deploys them together. All the code required for executing the services is packaged in the mini monolith. Hence you can dockerize these and deploy them as containers. These containers can be executed in a container management deployment framework such as Kubernetes. Alternately these containers can be deployed in individual machines (both real and virtual). Mini monoliths contain code and configuration. These interact with other mini monoliths in the ecosystem to accomplish the overall functionality. The mini monoliths may rely on additional resources such as databases, caches, service registries, API gateways, Kafka (or similar) brokers etc. 

## Separating Development from Deployment
Chenile strongly advocates that development must be de-coupled from deployment. This means that the developers don't upfront assume where the service is running. In fact, we have constructed mini monoliths which are capable of running both in the cloud and the edge (using relevant configuration information). 

In this scenario, if service1 needs to call service2, it should not assume where service2 is running. It might be running locally in the same VM or it might be running remotely in another VM. Hence a service2 proxy is required to access service2. This proxy will abstract the deployment complexity of service2 from service1. Please see the [proxy framework](chenile-proxy.html) for more details. 

## A note on Code Modules 
Code Modules show themselves as projects in the IDE such as Eclipse or IntelliJ. Each code module is responsible to generate one JAR file. The build process produces the JAR file from the code module code. 

In Chenile any service is split between two code modules called API module and the service module. For example, service1 is split into two code modules - service1-api and service1-service. API contains only contracts that are exposed by service1. The service module contains the implementation of the contracts defined in service1-api. If service1 depends on service2 then the dependency is reflected as service1-service depending on service2-api. Since there is no dependency between service1-service and service2-service, it is not possible to write code that depends on how service2 is implemented. This keeps it clean and modular. We will discuss code modules more in testing below.

# Validation Strategy - BDD, Cucumber, Spring MVC etc.
Chenile services must be developed to be independently testable. We should write code that can be tested via HTTP not just using simple beans as is usually done in traditional JUnits. This means that we need to integrate Spring containers, H2 database for mocking databases, Spring MVC for testing web based invocations etc. Spring Boot provides this entire infrastructure and Chenile leverages this in its code generator. 

Further, we recommend Cucumber for Behavior Driven Development (BDD) so that developers can validate their test cases with their business analysts. We have integrated Cucumber with Chenile services when we generate them using the code generator. See [this section for more details](chenile-testing-tutorial.html)

## Code Modules & Testing
Since the services are generated in independent code modules, it is possible to test them independently as well. In case service1 depends on service2 then service1-service only depends on service2-api and not on service2-service. This keeps the testing of service1 independent of the testing on service2. In rare cases, it is possible that we might want to have a dependency service1-service -> service2-service in scope = 'test'. That approach is recommended only for highly cohesive services. Otherwise, it is best to mock service2 in testing service1.  

This is compatible with Consumer Driven Contracts (CDC) as well. CDC eliminates the need for different mocks existing for the same service in different consumers test code. 

# Database Schema - Command & Query Databases
In the micro services world, the data is split between different databases - each one belonging to different bounded contexts. Typically, each bounded context will have its own database. This works well for commands which are responsible to create, update and delete data in the bounded context. 

However, queries will require data that spans across different databases. This results in the much dreaded "n+1" selects problem which poses a big problem for scalability. Chenile recommends that we split the command and query responsibilities in accordance with the CQRS pattern (Command Query Responsibility Separation). We recommend different frameworks for Command and Query. For command, we can use a standard ORM such as JPA or Hibernate. For query, we recommend a simple framework such as Mybatis. We will discuss these patterns in other pages. 

Chenile leverages spring integrations with JPA and Mybatis in its code generators. 

# Code Separation
Code needs to be split into code modules. Each code module does a small slice of functionality. As specified below there must be different code modules for API and service. Other common functionality must be available as libraries which are common core modules that can be controlled by the architecture teams. 

Further, there must be a distinction between Non functional requirements (NFR) and functionality. Functionality - such as User management , Order management etc. must be owned by different bounded contexts. But there must be other teams such as Architecture team, performance team etc, who own NFRs. NFRs are also implemented in a common way using Chenile interceptors that can then be integrated with the code execution pipeline. (see [this section on last mile interception](last-mile-interception.html). )

Thus Chenile with its code generation capabilities and base modules provides a solid edifice to write Micro services. 

# Other Benefits

* Very often programmers write a ton of similar boiler plate code to achieve logging, monitoring, and a myriad of other horizontal concerns. They implement them by duplicating code rather than re-using it. This is because it is difficult to find a framework that incorporates them seamlessly. Even if it does so, it does not do it across all transports. It may be HTTP specific.

* Concepts such as service registry often take a back seat. It is hard to find one single place where all the micro services are documented and could be "discovered". Chenile services register themselves into one common registry and hence we have an opportunity to create a common registry for all services. 

* Design paradigms like modularization, dependency injection, testability, SOLID principles etc. very often take a back seat since programmers are busy solving functional problems. This lapse tends to manifest itself at a later stage leading to substantial re-writes

* Standardization is another illusory pursuit. Many people use different open source frameworks. Sometimes, they use the same technology differently in the absence of an established standard. 

* DevOps requires a lot of effort. This includes the time spent in writing build and deployment scripts, achieving versioning, achieving docker builds etc. Programmers tend to focus on these rather than spending time creating functionality.

* Developers also spend a lot of time in exposing transports such as HTTP, writing JSON encoders and de-coders and stitching middleware with the services. 

* Similarly concerns like circuit  breaking, rate limiting etc. tend to get de-prioritized. They are implemented as a kludge much later.

* Developers also struggle with entities that have workflows. 

* Very often, there is not much of a distinction between an architect role and a developer role. Application developers must concentrate on one important thing -  i.e. understand the domain and write application code. Architects must choose the frameworks, integrate them together, establish standards and write framework code.

So, our idea was to build a RAD (Rapid Application Development) framework to get all developers immediately productive. The RAD must also establish standards, conventions and provide common services required throughout the estate.  

# What does Chenile do?
* Chenile is a fabric. You can use it to stitch Micro services. You can write services without worrying about transports, middlewares, horizontal services, transformations etc. Chenile allows these to seamlessly incorporated by framework architects whilst allowing developers to write functional code.
* Chenile is a Java Library that contains framework code. But the framework code is just the tip of the iceberg.
* Chenile comes bundled with a code generator that generates typical boiler plate code that conforms to a stereotype. (such as a HTTP over JSON Micro Service for example)
* Chenile ships with its own workflow engine which acts like a State Transition Machine (STM). 
* Chenile has an implementation of a Chain of responsibility. This provides a flexible command framework that allows a complex task to be decomposed into a chain of commands - each command implementing a slice of work. 
*  Chenile comes with documentation that talks about coding principles and how to achieve these principles.
*  Chenile ships with examples that contain a lot of example code.
*  Chenile's code generator also creates Makefiles, Dockerfile etc.
*  Chenile  identifies common usecases that can be solved - eg. developing microservices, creating 'mini-monoliths' (more on this later) etc. These use cases become Chenile stereotypes. Code generators help in generating code that conforms to these stereotypes
* Chenile helps in the solution of horizontal concerns. It integrates with myriads of different frameworks that facilitate logging, auditing, i18n etc.
* Chenile establishes standards and conventions that ease code development and maintenance.

# This is all cool.. but doesn't Spring Boot already provide these ?
We agree that Spring Boot is an awesome ecosystem. In fact, we like it so much that we built Chenile on top of Spring Boot!
Spring Boot is not opinionated. This is good because it caters to different use cases. Chenile seeks to impose certain opinionated standards on Spring Boot development. These stadards cover a gamut of things - from simple naming conventions to recommending certain design paradigms to standardizing how Maven must be used etc.  

These standards are automatically incorporated in Chenile Micro services if the Chenile code generator is used. 

For example, it takes less than 5 minutes to generate a Spring Boot micro service that does the following:
1. Have a multi module Maven project which separates development concerns from deployment and implements the Dependency inversion principle (DIP) of SOLID
2. Supports multiple transports - HTTP being one of them
3. Adheres to established naming conventions
4. Generates Swagger docs and other files that allow us to document this service in a service registry
5. Adheres to established ways of implementing a work flow
6. Incorporates horizontal concerns seamlessly
7. Uses standardized exception handling 
8. emits a response in one standard format with provision to return exceptions, errors and warnings
9. Uses international message bundles
10. Implements test cases with a sophisticated Cucumber access and a standardized Gherkin language
11. Facilitates versioning strategies and builds a CI/CD pipeline
12. incorporates observability 
and much much more.  

This obviates the need for developers to wade through endless documentation, stack overflow pages and sift through multiple opinions. In short, you have more time to implement functionality without worrying about semantics, best practices etc. (which you will also eventually learn by looking at Chenile's documentation)

In short, Chenile makes you productive on day one instead of waiting for months! 



