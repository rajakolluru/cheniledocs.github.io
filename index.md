---
title: "Chenile -  Micro Services - done right! "
keywords: homepage
tags: [getting_started, introduction]
sidebar: wego_sidebar
permalink: index.html
summary: Why Chenile? We discuss the rationale here for a framework and how Chenile can help.
---

{% include note.html content="An introduction to Chenile. Want to use it write away? Go to <a href='chenile_setup.html'>set up page</a>" %}

# Motivation 
Micro services have become the prevalent paradigm for development. We could create autonomous teams with segmented responsibilities. Each team knows its respective domain and builds services in them. All the teams collaborate to create an ecosystem that can accomplish complex tasks with aplomb. 

As one of the most popular server side programming languages, Java is a language of choice to implement Micro Services. Especially, with Spring Boot, it is a cinch to create new micro services. Developers have access to multiple frameworks that can be used to implement all the concerns of Micro services. 

Therefore, we do need a strong justification to add another new framework into the fold. 

<a name='thewhat'/>
# Why do we need a framework?
In our experience of working for over three decades in application development, we have observed a few things that most organizations struggle with:

* Very often programmers write a ton of similar boiler plate code to achieve logging, monitoring, and a myriad of other horizontal concerns. They implement them by duplicating code rather than re-using it. This is because it is difficult to find a framework that incorporates them seamlessly. Even if it does so, it does not do it across all transports. It may be HTTP specific.

* Concepts such as service registry often take a back seat. It is hard to find one single place where all the micro services are documented and could be "discovered"

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



