---
title: Chenile Last Mile Interception
keywords: chenile  interception
sidebar: chenile_sidebar
toc: true
permalink: /last-mile-interception.html
folder: chenile
summary: Chenile - Last Mile Interception
---
Last mile interception enables the seamless implementation of service policies in the last mile. Chenile framework supports last mile interception. Multiple strategies can be used for providing an interception framework.These are discussed below along with the pros and cons of each of these strategies. 

## Features
Chenile last mile interception framework  provides the following features:
1. **Predictable Interceptor Set:** It must provide a predictable set of interceptors that can be pre-configured at the service and deployable (mini monolith) level. 
2. **Interceptor Variation by Service/Operation:** The number of interceptors can vary depending on the actual service and even the operation that is invoked. The service-operation combination must be the key - not the URL. A URL must be mappable to a service-operation combination. 
3. **Exchange:** The interceptors must be able to access an object model (typically called an exchange) that contains the entire context of the request.  The _exchange_ will be progressively enhanced to produce the response. 
4. **Transport Agnostic:** The interceptors must not be tightly coupled to specific transports such as HTTP.
5. **Local Service Registry with Service Policies:** All services must be configured in a "local service registry". The service configuration contains the meta data for the service. Examples of such meta data include service name, description, URL etc. . The service registry must be extensible. It must support service policies as extensions. In this way, as new policies get added, the service registry will continue to support them. 
6. **Access to Request and Response Body/Exception:** The exchange must also allow access to request and response parameters along with response exceptions if any. This allows the interceptors to seamlessly mutate the service request and response.
7. **Micro Routing:**To facilitate micro routing of services, it must be possible to route the request to a different service (that implements the same interface). The interceptors must have the ability to alter the exchange so that the destination service can change.
8. **Dynamically Changing Orchestration:** It must be possible to change the orchestration of interceptors in a flexible manner. This can include the choice of interceptors, the order of interceptors etc. This must be possible dynamically depending on the request.
9. **Client Side Interception:** It is desirable to have client side interception capabilities. This is useful when the service is invoked remotely. Before invoking the service, the client side interceptors can kick in and provide service policies for the client before invoking the service (optionally) It will be useful if the client side interceptors and the server side interceptors can be constructed in a similar fashion so that it becomes easy to use them interchangeably
10. **Unobtrusive:** The service class must not be aware of the fact that the request is being intercepted. It might make assumptions on request enrichment (for example if additional User information has been fetched by an interceptor). But for the most part, the service class must be authored in such a way as to be completely oblivious. 
11. **Architect vs. Developer Role:** Architect is responsible to configure the interceptors for a particular service. Architect will also be responsible for setting up the service policies. The developer of the service will not really need to worry about the service policies. In this way, we can configure a service policy set up that is a combination of top-down and bottom-up configurations. Top-Down policies originate from org specific and company wide policies. Bottom-Up policies are specific to services and can be configured by the developers.  

## The Design of the Chenile Framework
The Chenile Framework was conceived as a transport agnostic open source framework that defines services and operations. (akin to Java classes and methods). These services and operations are defined in a _local service registry_ i.e. a service registry that is locally available in the deployment. For more information see [Local Service Registry](local-service-registry.html)

The Chenile framework allows flexible configuration of interceptors on a per service,operation basis. Please see [request processing pipeline](chenile-request-processing.html) for a discussion on configuring the request processing pipeline in Chenile. The Chenile request processing pipeline uses a common entry point to which all transports delegate their requests after first converting the incoming request to a transport agnostic exchange called [Chenile Exchange](chenile-exchange.html). 

The Chenile pipeline is super light weight. It manufactures a chain of POJOs using [Chenile Orchestration](chenile-owiz.html). These chain of POJOs are used to process the incoming Chenile Exchange. 

## How does Chenile take control of HTTP?
Chenile employs one of two strategies:
1. It can stand up a controller of its own to serve as the HTTP end point. Chenile leverages the http URL mapping mechanism to match all URLs to a common HTTPEntryPoint. The entry point listens to the HTTP Servlet Request and then delegates it to the Chenile pipeline.
2. It can use existing Spring Rest Controllers to do all the work. The controller can then start the Chenile pipeline.

The latter approach is favored for HTTP centric services. The work becomes easy and already has support for Open API generation. The former is preferred if an HTTP end point is not even required. 
## Alternatives Considered
Considering all these requirements, most HTTP based interception frameworks like Spring Interceptors, Servlet Filters etc. were found wanting. Here is a table that summarizes the problem.

| S. No. | Feature  | Chenile | Spring or HTTP Interceptors | Spring AOP |
|--------|--------|----------|-----------------------------|------------|
| 1|Predictable Interceptor set | Y |Y but this becomes distributed |Y but configuration gets embedded into Spring @Configuration|
| 2|Interceptor variation by service|Y|N|N|
| 3|Exchange Object|Y|N|N|
| 4|Transport Agnostic|Y|N|Y|
| 5|Local Servie Registry with Service Policies|Y|N|N|
| 6|Access to Request and Response Body/Exception|Y|N request and responses are accessible only as streams|Y|
| 7|Micro Routing|Y|N|N|
| 8|Dynamic Orchestration|Y|N|Y to an extent with AOP advisors which are of late not used much in real world applications|
| 9|Client Side Interception|Y|N|N|
|10|Unobtrusive|Y|Y|Y|
|11|Architect vs. Developer|Y|Harder to set up|Harder to set up|


As a result, the Chenile Orchestration framework provides a viable option to implement last mile interception. 

<a name='last_mile'/>

## When is it good to use Last Mile interception?
Last mile interception allows the architect to distribute service policies in the organization. It is similar to the notion of a service mesh. In fact, the Chenile framework allows for an IN-VM service mesh with the ability for services to pick up the correct policies and weaving them to form the service pipeline. This gives a huge benefit in the following situations:

### Volatile Concerns
Concerns that have a large rate of change. In this case, we are better off implementing in the last mile rather than in the gateway. Such policies,if implemented in the Gateway, will require frequent gateway redeployments thereby affecting multiple services. They will also consume gateway processing memory and to a smaller extent the processing power. 

### Service Reference Policies
Choose between different service implementations for different segments of user (based on geography, demographics or plain A-B testing). These experimentations are tied closely to the service itself and should not be pushed into generic gateways.

### Org Level Policies
These policies are applicable for a particular org and must be ideally implemented in the last mile. Otherwise, the central API Gateway will get needlessly cluttered with concerns of different orgs.

### Service Specific Interception
If the service is super generic, then the interceptor can be useful to introduce specific behavior depending on the context of the request for the service. For example, a generic service might need specific payloads depending on other header parameters. The transformation service allows for that level of customization. It is hard to do this in any other layer. 


