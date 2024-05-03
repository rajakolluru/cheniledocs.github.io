---
title: Chenile Development Model
keywords: chenile  servicemesh
sidebar: chenile_sidebar
toc: true
permalink: /chenile-development.html
folder: chenile
summary: Chenile - Development Model
---
Chenile consists of two types of development assemblies. One is called a code module and another is a code package.

Code Module is a Maven JAR module containing Java classes and resources. A code module contains the code for implementing a particular service or utility or API. Here are some types of code modules:

API code module
: An API code module's name ends with -api (e.g., user-api) It contains interfaces and model objects. They define the contracts for a particular service. If service1 depends on service2, it only consumes service2's API code module. 

Service Code Module (aka Impl)
: A service code module's name ends with -service (e.g., user-service). It contains classes that implement the contracts defined in the corresponding api code module. This contains implementations, health checks for the service, controller classes to define the service and finally the Spring configuration classes that instantiate these classes. DAO's are also packaged in the service module.

Configuration Code Module 
: This contains only configurations. This module is tied to a mini monolith. For example, if we desire to make a mini monolith called commerce by packaging all the commerce related services together then this module contains all the configurations for different environments. This code module is controlled by the SRE folks in conjunction with the developers. This module contains secrets, application.yml (or application.properties), application-{env}.properties (or yml) etc. Hence this module is tied to deployment and a mini monolith. 

## Code Packages
Code packages are a special type of code modules. They make an executable JAR using spring-boot-maven-plugin. This code package is a collection of the relevant code modules (including api, services and configurations). The code package makes an executable Java jar file that can be run with java -jar. Hence this packages all its dependencies as jars. In Chenile, we create a separate profile called "it" to run integration tests on the packages. The integration tests are automatically triggered when the package is built. 


## Packaging using Code Modules
Chenile enforces a code module structure that separates the responsibility of the developers, architects and System Reliability Engineers (SRE). 

Code modules are Maven projects that appear in IntelliJ or Eclipse as separate projects. Code modules contain code and their instantiation. All code modules are responsible for instantiating their classes. All classes, that are thus instantiated, must be configured in Spring. 

Other modules who are dependent on a code module rely on Spring to autowire their dependencies. For example, if AuthService depends on UserService, then it just codes to the contract of UserService (which is assumed to be declared in a code module called user-api) . UserService must be instantiated in the user-service code module. Thus spring instantiation is the responsibility of the code module. Unless the code itself is a strict library (like STM for example) in which case the code is instantiated by the consumers of the library. 

Individual applications are built by writing a bunch of micro services. Each micro service has two code modules. For example, service s1 has two code modules - s1-api and s1-service.  Applications consist of services and mini monoliths. Service code modules contain the service code as POJOs. They also contain controller code that registers the service with Chenile. Services are not Spring Boot jars. So they cannot be deployed. To deploy services, we need to use a mini monolith. The mini monolith contains a package project that bundles a bunch of services together and slaps a Spring Boot main application on top of them. The package itself is unaware of the services that it is deploying except in the POM class. 

This makes packaging very flexible. We can change the packages when we deem fit. The decision to pack a bunch of services lies with the architect / SRE (System Reliability Engineering) teams rather than the individual developers. This gives a lot of control on the packaging to the SRE teams. 

Consider the code modules diagram below:
![Code Modules](/images/chenile/code-modules.png)

In the above diagram there are three services s1,s2 and s3 which are packaged into a mini monolith m1. Service s1 depends on service s2 and hence there exists a dependency between s1-service and s2-api.

## Horizontal Concerns
Horizontal concerns are implemented using their own code modules. These code modules are consumed by Chenile interceptors which are transparently injected into the request processing pipelines by the architects. There is no direct dependency between horizontal code modules and service code modules. However, horizontal code modules will need to be packaged together by the mini monolith so that horizontal services can be introduced into the Chenile pipeline.

## Chenile Bill Of Materials
Chenile supports a bill of materials and provides a single point of upgrade to all the versions used in the enterprise. Chenile inherits from the latest Spring Boot super pom so that the versions are standardized in one place. Individual code modules do not specify version information. Instead they inherit from Chenile super pom and use the dependency management specified there. 


## CI Friendly builds
Chenile uses CI friendly maven variables such as "revision". "revision" is defaulted in the POM but will be injected into the maven command line after being obtained from git tag (using git describe). See the generated Makefiles for more details.

![Library Stack](/images/chenile/library.png "Library Stack")