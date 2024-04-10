---
title: Chenile Proxy Framework
keywords: chenile  proxy
sidebar: chenile_sidebar
toc: true
permalink: /chenile-proxy.html
folder: chenile
summary: Chenile - Proxy Framework
---
Let us take a service called s1 that depends on another service s2. In keeping with Chenile standards both s1 and s2 will have two code modules each viz. s1-api and s1-service, s2-api and s2-service. Since the dependency must be on contracts only and not on the implementation - s1-service depends on s1-api. 

In runtime, s1-service will need s2-service injected so that it can peform its job. That is possible if s1 and s2 are packaged together into one mini monolith. What if that is not the case? Then s1 will need to talk to s2 remotely using HTTP. That means that s1 will know where s2 is deployed. This defeats location transparency. Secondly, s1 needs to write Rest Template kind of code which is cumbersome and has its own concerns such as circuit breaker logic, retry logic etc. 

Chenile keeps the deployment separate from development and preserves location transparency. Hence s1 must not need to know where s2 is running. It accomplishes this by the Chenile Proxy Framework. We will see how to use the Chenile proxy to address this problem. 

In short, Chenile Proxy provides an injectable implementation of a service that we depend on - the injected service has the same interface as the actual service. Hence the caller is unaware whether it is calling a local service or a remote service. 
The proxy uses the service registry to determine where the service is running and calls it accordingly. The Chenile HTTP Remote Proxy uses HTTP to communicate with the service in runtime. 

## How does it work? 
Chenile uses Java Proxy to mimic the interface. Since it knows the URL that is exposed by the service and the expected signature of the method that needs to be called, it will call the service and converts the result into the object to return it back to the caller. 

## Client Side Interception
Chenile Proxy supports client-side interception capabilities. Concerns such as near caching can be addressed using client-side interceptors. Client-side interceptors are interchangeable with server-side interceptors. This allows flexibility for architects to choose where the interceptors are injected
* 
Proxy routes to a local or remote proxy depending on where the actual service exists
* Local proxy delegates to the local Aurora entry point.
* Remote proxy manages interactions with the remote server via HTTP
* These capabilities make the Aurora framework a service mesh with both ingress and egress interception capabilities

![Proxy Framework](/images/chenile/proxy-framework.png "Proxy Request Processing Cycle")

