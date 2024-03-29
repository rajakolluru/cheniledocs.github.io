---
title: HTTP transport
keywords: WeGO http transport
sidebar: wego_sidebar
toc: true
permalink: wego_http.html
folder: wego
summary: How is the HTTP transport handled? How is it handled in the server side and the client side?
---
## Introduction
One of the objectives of WeGO is to expose services via transports. The HTTP module exposes the HTTP transport to all services which have registered with a URL in WeGO. A URL exposes an operation in a service. As the service gets registered in WeGO, the http module exposes every operation via its configured URL 

Like any transport, the HTTP registers itself in WeGO as an extension. During initialization, WeGO calls the http module for every operation exposed by every registered service. The HTTP module enables the HTTP transport for the operation if a URL is configured for the operation. During runtime, every call to the URL triggers a call to the operation in the service.

In the client side, the WeGO http module has methods to consume a HTTP service by providing a HTTP proxy.

## Exposing a service via HTTP
This is called by WeGO only when the service is configured in "server mode". For client side registrations, the service is registered but no transport is exposed. The registration is used to make proxy calls to the service via HTTP. 

The HTTP module currently supports JSON as the default encoding mechanism. Other encoders will be added in the future.

The transport uses go-kit and MUX to expose the HTTP transport. The MUX is enhanced with middleware that works well with New Relic so that the HTTP request/response statistics are automatically captured.

The HTTP transport uses the [WeGO Service Pipeline](wego_pipeline.html) to invoke the service. 
<a name='httpinvoker'/>
## Consuming an HTTP service
A client-side registration is sufficient to access a service using a HTTP Proxy. In this case,  the WeGO client obtains the service descriptor to know about how to access the service. 

### Host Name and Port of the Service
WeGO looks for a special property with name "<service name>host_port". For example, for a service "foo" it looks for property called "foohost_port". That property is supposed to provide the service hostname. 
If WeGO does not find this property, it defaults to localhost: + bplus_port to access the service. This will work for test cases etc. but is not suitable for production.

The proxy uses a [Proxy Pipeline](wego_pipeline.html#proxy_pipeline) to invoke the service via HTTP.

## Mapping Operation Invocations to HTTP Requests/Responses
A WeGO service consists of a series of operations. Each operation can be of the form:
```go
FooOperation(ctx context.Context, param1 int, request *RequestPayload)(ResponsePayload,error)
```
In this case, the FooOperation requires three parameters to be passed to it. It will respond with a response and an error. 

The first parameter is context and is mandatory. It represents the context of the HTTP request. It will have all the HTTP headers in it. This includes standard HTTP variables such as IP address, host name, URL and the like.  
The second parameter - param1 is of type int.  param1 is a HEADER parameter and will be discussed below in detail.

The third parameter is the PAYLOAD parameter. This is obtained from deserializing the HTTP payload. Currently the only encoding supported is JSON. But as WeGO adds to the different types of supported encodings, it will be able to deserialize the stream of bytea received via HTTP into RequestPayload.

After the service is invoked, the response and error are gathered. 
The ResponsePayload is serialized into the correct expected encoding (currently only JSON is supported) and streamed back as a HTTP response.
The error is checked to see if it is of type __HttpCodeProvider__. If the error implements the interface, then the error code is determined and emitted out. Otherwise, a generic http 500 error code is emitted out.

### How are HEADER parameters passed in HTTP?
param1 in the example given above is of type int. It comes from the header of the request. It can be passed in three ways in the HTTP protocol:
1. By setting it as a HTTP header. For example in curl we would do something like
```
curl  -H "Param1: 29" localhost:5000/BarService/FooOperation
```
2. By passing it as a Query parameter. Example:
```
curl   localhost:5000/BarService/FooOperation?Param1=29
```
3. By passing it as a Path parameter
```
curl  localhost:5000/BarService/FooOperation/29
```
Please see [stringdemoapi](https://github.com/agorago/stringdemoapi/blob/master/register/register.go) for a demonstration of all these features.

## How does HTTP Proxy handle the response?
The HTTP proxy invokes the URL and obtains a response to it. The response is then deserialized back to the ResponsePayload struct and returned back to the caller.

In case, there is an error, an attempt is made to deserialize the response payload to a WeGOError. If it cannot be deserialized then a new error is constructed and returned back to the caller. 



