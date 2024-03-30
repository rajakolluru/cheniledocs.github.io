---
title: Logical Architecture
keywords: chenile  logical
sidebar: chenile_sidebar
toc: true
permalink: chenile-logical-architecture.html
folder: chenile
summary: Chenile - Logical Architecture
---

# Logical Architecture

A typical Chenile app backend has the following logical components:
1. API Proxy: The Chenile API proxy fronts all requests to every Chenile service. It uses the service policies that are defined and implements some of them such as authentication, role based authorization and rate limiting. 
2. Service Registry: Chenile service registry provides additional information about the service such as the hosting information (load balancer URL) and service signatures. It also defines the service policies. These are used by the Chenile framework to implement the policy for the service.
3. Chenile Service Deployments: A Chenile Service deployment (described in detail [here](deployment)) can hosts multiple services. These services are packaged together into a mini monolith which is hosted in one place using WCNP or equivalent. The Chenile service deployment keeps a bunch of services in one place and can provide "last mile interception" capabilities.

# Libraries
Chenile services can be built using Chenile libraries. Libraries provide the following functionalities:

## Chenile Request Processing Capabilities
Please see Chenile request processing capabilities [here](request-processing).

## Chenile Last Mile Interceptors
Chenile provides a set of last mile interceptors to implement specific horizontal requirements. Last mile interceptors are described in [this section](last-mile-interception)

## Chenile Error Handling
Chenile supports both errors and warnings using standardized conventions and signatures. Error handling is explained [here](error-handling)

## 

## Testing Support
Chenile framework supports a Gherkin language that can be used in formulating test cases. The Gherkin language abstracts Spring Mock MVC framework and allows the service to be invoked remotely from another process. It starts a server and hosts the service so that the service can be invoked externally. In this way, everything in the service including serialization/de-serialization will be tested. 

For more information, see [testing](testing)

