---
title: Chenile Request Processing
keywords: chenile  request_processing
sidebar: chenile_sidebar
toc: true
permalink: /chenile-request-processing.html
folder: chenile
summary: Chenile - Request Processing
---

# Request Processing Pipeline

![Request Processing Pipeline](/images/chenile/request-processing.png "Request Processing Pipeline")

## Introduction
Every service is a combination of functional and non functional requirements. Typically, functional requirements are implemented using a service class.  More specifically, the service class implements the business logic in a particular operation (or in Java terms a method). 

## Service Policies
Non functional requirements are commonly referred to as service policies. The service class must not be bothered about service policies. This recommendation is in accordance with the Single Responsibility Principle (SRP) which stipulates that every class must have only one functionality. 

### Where are service policies implemented?
Service policies can be implemented at any of the upstream API gateways or at the actual service level. Chenile provides a last mile interception at the service level. This is available in addition to all the upstream service policies that the incoming request comes through. For an overview of Last mile interception please see [this page](last-mile-interception)

## Service Pipeline
Chenile implements last mile interception using a service pipeline. Service interceptors are lined up along the pipeline. Each of the interceptor must implement a service policy. Policies related to logging, security, transformations, caching etc. get progressively implemented in the pipeline. The last interceptor will invoke the service class. The pipeline is a two-way street. All the policies are invoked on the way back as well. 

## Service Interceptors
Service interceptors are nodes in the request pipeline. Each interceptor implements a particular service policy. Service interceptors work on a [common exchange object](exchange) that provides the entire context of the invocation. 
The pipeline and interceptors are discussed [below](#seda-pipeline)

## Transports & Controllers
For a service to be considered useful, it needs to be exposed via some transport end point. Transport end point can include HTTP & KAFKA end points. These transports need to be "bound" to the service pipeline. 

A controller is typically used to expose the service. The controller delegates the functionality to the service pipeline which ultimately invokes the service. This is described in the sequence diagram below:

![Request Processing Sequence](/images/chenile/request-processing-sequence.png)

<a name='seda-pipeline'/>
## SEDA Pipeline
Staged Event Driven Architecture (SEDA) is a common middleware paradigm that is used to achieve middleware functionality by combining light weight processes in an asynchronous way via events. 
In Chenile, we will use a simpler version of the SEDA pipeline by chaining a set of commands in the JVM. The execution is sequential here so that each processor can build on the work of its predecessor. 

As mentioned before, each node in the chain is an interceptor which implements a particular service policy (such as logging, security, transformations, caching etc.) The last interceptor will invoke the actual service. 

This lightweight pipeline currently uses the thread that is initiated by the underlying server for every request. It can easily be upgraded to a proper SEDA pipeline with its own thread management if the requirements warrant such an implementation. 

The pipeline uses a SEDA exchange object to preserve the context of the request as it gets processed. The [Chenile exchange](exchange) object provides the exchange functionality.

## Service Configuration
The functionality of individual interceptors might vary from one service to the other. e.g., The authorization interceptor needs to know the role that it needs to authorize the user against. This will vary from one service to the other. Hence the overall service configuration must include specific configuration for various policies. Individual interceptors consult the service configuration while intercepting the particular service. This makes the interceptors flexible. We don't need to build out specific interceptors for each service. 

## Processor Sequencing
Typically, processors are sequenced in this order

[![Default Interceptor Chain](/images/chenile/default-interceptor-chain.png)](/images/chenile/default-interceptor-chain.png)

### ErrorHandler
Error handler must be the first interceptor. This will also make it the last interceptor for the purpose of post processing. Hence it would have the opportunity to handle all errors in one place. Chenile ships with its own error handler. This can be over-ridden at the mini monolith level in "chenile.properties" file. 

### Pre Processors
Pre processors are the first set of interceptors. These don't look at the payload of the request. They need only the headers to make a decision. e.g.,a logging interceptor which might just need to log the request and the response.

### Transformation
For more details see [transformation page](transform). 
In this phase, the request undergoes transformation. The correct body type is determined. The incoming payload (typically a JSON) gets converted to the correct body type. This process is skipped if the controller has already done the job of conversion. 

### Service Reference Chooser
If a different version of the service is required to be invoked, the new reference is chosen at this stage. This allows the Service to be customized based on various criteria such as A-B tests, region wise customization, language wise or demographic wise customizations etc. See [Service Customizations](service-customizations)

### Post Processors
These interceptors require the payload to be of the correct type.Post processors can be customized at the mini monolith level (i.e. for a bunch of services deployed together).

### Operation Specific Processors
These processors provide additional processing for a particular operation. This processing is specific to the particular operation 

### Service Specific Processors
These processors will be applied for every operation exposed by the service i.e. they are defined at the service level 

### ServiceInvoker
This processor actually invokes the service. The service that needs to be invoked has already been identified by the Service Reference chooser above. 

## Interceptor Chain
Chenile uses an OWIZ based interception framework to configure the service and interceptors that need to be applied.

## Controller - Service Separation
The service class must be separated from the controller. Controllers provide the entry point for all requests. Spring provides a controller that supports HTTP end points. A URL is mapped to the operation within a controller using standard Spring post annotations such as @GetMapping, @PostMapping etc. 

Chenile provides two ways to configure the Spring processing pipeline:
1. Use a Spring controller to configure the entry point for HTTP requests. Use standard Spring annotations to configure the controller. Add additional Chenile annotations to configure policies for the service.
2. Use a JSON to completely configure the service end to end. Let Chenile provide the controller to intercept all HTTP requests. 

## Chenile Entry Point
Ultimately, all requests converge to a common internal entry point called Chenile Entry Point. From this point onwards, Chenile provides a Chenile Highway with all the interceptors and the service woven into it. The entire request context is put into a [Chenile Exchange object](exchange). 

## Chenile Interceptor
Each interceptor in the Chenile Highway must extend from ChenileInterceptorBase. This class provides convenience methods to perform pre or post processing. It also contains methods that allow the interceptor to be bypassed in case the request does not have to be intercepted. The exchange provides access to the entire configuration for the service. ChenileInterceptorBase has convenience methods that extract the configuration information from the exchange. 




