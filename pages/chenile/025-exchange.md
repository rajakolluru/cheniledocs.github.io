---
title: Chenile Exchange
keywords: chenile  exchange
sidebar: chenile_sidebar
toc: true
permalink: /chenile-exchange.html
folder: chenile
summary: Chenile - Exchange
---
Chenile treats every incoming request as a message irrespective of the transport. Chenile uses a class called _ChenileExchange_ for internally processing every request. All transport adapters convert the transport specific request into a _ChenileExchange_. For example, the HTTP request processor converts the HttpServletRequest into ChenileExchange. 

# Need for an Exchange
**Staged Event Driven Architecture(SEDA)** allows the assembly of a sequence of processors that act on an exchange object. The SEDA model decouples the threads from the execution. It is possible to run the sequence of events in the same thread or span across multiple threads. This means that the entire request information must be contained in a mutable _exchange_ object that contains the entire context. 

The _ChenileExchange_ class provides such an exchange object. The exchange is handed from one processor to the next. _ChenileExchange_ is progressively mutated by each of the processors. The last processor in the chain invokes the underlying service class. 

To understand the request processing series in detail, please see [Request Processing](chenile-request-processing.html)

# Structure of ChenileExchange 

<img src='/images/chenile/chenile-exchange-class.png'/>

The entire context of the request is contained within this exchange. The ChenileExchange can be approximately broken down into the following types of fields:

## Invocation Context
These fields specify what operation or service needs to be invoked. This is the type of information typically found in a service registry. This information is mapped to the transport using a binding. For example, in the context of HTTP the invocation context is bound to a URL. In a Kafka invocation, this context can be bound to a Kafka topic. 

The Exchange object needs to be instantiated with the invocation context. 

## Request 
The headers and body provide the request context. They specify what the caller expects out of the interaction. Typically all enterprise messages contain a payload and a bunch of headers which are referenced using String keys. 

The body comes in formats such as JSON and will then be converted to the actual body type by transformation processors. ChenileExchange also supports multiPartMap to enable multi part messages.

## Response
The response from the service (or any of the intermediary processors) is contained in the response object. Any exception thrown will also be contained within exception.

Typically, all exceptions will be of type ErrorNumException. ErrorNumException provides additional information such as the HTTP response code, sub error code (to denote the specific service error), the field that triggered the error, the description of the error, the additional params of the error etc. Please see the [api model](chenile-api-model.html) for additional information.

## Mutated Invocation Context
The invocation context is the source of information for invoking the actual service and also to choose the processors involved in the service. However, some processors might decide to change the service to a different service. This is typically true in the context of A-B testing where the processing might culminate in an experimental version of the service. It is also true in mock mode where a mock service can handle the request.

The exchange object provides room for the service reference to be changed.

# Processors
The SEDA pipeline mutates the ChenileExchange to obtain the desired results. Please see [request processing](chenile-request-processing.html) for more details


