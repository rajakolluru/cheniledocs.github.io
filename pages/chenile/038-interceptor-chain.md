---
title: Chenile Interceptor Chain
keywords: chenile  interceptor
sidebar: chenile_sidebar
toc: true
permalink: /chenile-interceptor-chain.html
folder: chenile
summary: Chenile - Interceptor Chain
---
# Interceptor Chain
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

