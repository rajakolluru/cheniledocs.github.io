---
title: Core Framework
keywords: WeGO core model framework fw
sidebar: wego_sidebar
toc: true
permalink: wego_core.html
folder: wego
summary: The core of the WeGO framework. How does service registration work?
---
## The WEGO Core Service Mesh Framework 
WEGO can be thought of as an in process service mesh. It completely abstracts the service from the complexity of dealing with multiple transports, handling transformations and implementing horizontal requirements. 

On the client side, it can allow clients to access remote services by providing a proxy. On the server side it provides the transport end point and connects the end point to a service. The transport is also responsible to deserialize the requests and convert them to the form expected by the service. The transport in the return journey, serializes the response and sends it out.

On the client side, the proxy does the thing in reverse. WeGO also handles errors seamlessly and provides standards to emit errors from the server side to the client side. Middlewares are supported on both the client and the server side.

This entire process is illustrated in the diagram below:

![Interaction Diagram](images/wego/wego_interaction.png)


In this way, the WeGO library completely abstracts the service invocation from both the client and the server side. 

## The WeGO Core Package

The WeGO Core package allows the registration of services and their operations. It provides the fundamental edifice on which the entire framework rests. Here are the salient features of the core framework:

1. Provide ability for a service to register itself with WeGO. Services expose operations which accept parameters. The entire information is registered in WeGO core.
2. Provide ability for a transport such as HTTP to register itself as an extension to the WeGO framework. This keeps WeGO core simple and extensible.
3. Definition and registration of middlewares. These middlewares are invoked whenever the service is invoked. Middlewares can be registered for both client (proxy) and server.
4. The WeGO core package defines the central model for registration and Middleware that will be used everywhere.

 
## Service Registration

A service can have one or more multiple methods called Operations. Each operation can in turn accept parameters which can be encoded in multiple ways in the incoming request. Every service must register itself with the WeGO service mesh using the WeGO core package. 

WeGO services can register themselves in two modes:
1. Client Mode - the service information is registered. However the service is not exposed in this mode using any transport. This mode works well in the client side (proxy side) as shown in the diagram above
2. Server Mode -  the service is not only registered. It is also exposed via a transport layer such as HTTP.  This mode works for the server side shown above. 

##  A Note on Deployables
{% include note.html content="WeGO advocates that a bunch of services must be packaged together into a deployable artifact. A service will be hosted by one deployable in the server mode - i.e. the service will be exposed via HTTP using one deployable only. Other deployables will invoke the service using proxy. The service will be configured in 'client mode' in every other deployable." %}
Client mode is useful if it is intended to invoke the service using the Proxy framework that WeGO supports.However in this mode,  transports are not supported. 

## How do services register themselves?

A service is registered using a model object called _Service Descriptor_ that describes the service. It contains Name and a description. Besides that it contains an array of operations that describe the operations that the service supports. Each operation is described using OperationDescriptor.

Here is some code that can be used to typically register the service:
```go
import "github.com/agorago/wego/fw" // import WeGO core as fw
...
var serviceDescriptor fw.ServiceDescriptor
// construct serviceDescriptor
wegoService :=  
// Get hold of the wegoService first either from command Catalog or some other way
wegoService.RegisterService("<service-name>",serviceDescriptor)
```

If the service is registered in server mode, then a reference to the actual service is expected to be populated in the  the service descriptor. If service reference is null then it is assumed that the service is registered in client mode. 

## Operation Descriptor

Operation descriptors describe the operation that belongs to the service. The operation would be typically exposed by the transport. Since an operation is accessible from outside, it will expose a URL. Operations are invoked by WeGO when the transport is accessed. (for example when someone invokes the HTTP URL)

Operation descriptor gives details about the operation such as the following:
* name - used to actually invoke the operation from the service reference in ServiceDescriptor
* description, Request Description, Response Description - used to describe the service in generated swagger documentations
* URL - used to expose the operation via HTTP
* OpRequestMaker , OpResponseMaker - These functions generate empty request and response objects. useful to populate the objects from serialized streams of data (such as JSON streams)
* OpMiddleware, ProxyMiddleware - the middleware functions that will be invoked when the operation is invoked.

Please see [stringdemo service](https://github.com/agorago/stringdemoapi/blob/master/register/register.go) for an example. 

## Param Descriptor

ParamDescriptor allows the registration of each parameter that needs to be passed to the operation on invocation. An operation can have the following types of parameters as determined by ParamOrigin:
* Context - a mandatory first parameter for every operation. It should always be with name ctx. This contains the entire context of the request. WeGO mandates that all exposed operations accept context as the first parameter. (This is idiomatic GO also)
* HEADER - a parameter that is derived from a header in the request. In HTTP, HEADER parameters are passed as a HTTP HEADER attribute. Alternately, HTTP query params and PATH params are also available as header params.
* PAYLOAD - the payload parameter is passed as part of the body of the request. (for example HTTP request body) Payload will be de-serialized from a resource stream such as JSON.

## Middleware & Middleware Chain

The WeGO Core package defines Middleware and Middleware Chain. These implement the chain of responsibility pattern. We will discuss this in more detail in the [Middleware](wego_middleware.html) section.
