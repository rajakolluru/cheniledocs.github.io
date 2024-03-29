---
title: The Request Context
keywords: WeGO context
sidebar: wego_sidebar
toc: true
permalink: wego_context.html
folder: wego
summary: How is context passed around in the WeGO framework? How to use it? Who can access it?
---
WeGO strongly advocates the passing around of the request context object. In GO, the context.Context object must be idiomatically accepted as the first parameter of most functions and it should even be called ctx (wherever it is used). WeGO strongly advocates that most commands and services accept the context object as the first parameter for most of their operations.

## How should context be used?
Context is used for implementing horizontal concerns. Horizontal concerns must not be typically implemented by individual services since this would lead to proliferation of the implementation of the same concern by multiple services. (This violates the Single Responsibility Principle)

Context must typically not be accessed by the service object. The service object obtains all the information it needs from explicit parameter that are passed to it. For example, if a service requires an entity ID then that must be accepted explicitly to it. It must not be accessed via the context object. The WeGO framework has components that transform attributes contained in the context to explicit service parameters while invoking the service. For example, see the section on [middleware](middleware.html)

Context contains the "context" of the request. WeGO transports are responsible for setting up the context from request parameters. For example, all the HTTP headers will be copied to the context and hence it would be available for every service downstream. Context content is also copied in the proxy when making calls to other services. In this way, the entire request context is preserved even though the request may transcend multiple services. 

Context contains fields that take care of logging, traceability, auditability etc. These fields are logged and thrown back in exceptions so that the entire context can be re-constructed to a maximum degree of precision. 

## The WeGO Context package
This package is idiomatically used and referred to as wegocontext. In code, it is imported as: 
```
    import wegocontext "github.com/agorago/wego/context"
```
The wegocontext package has the following uses:

1. It provides an abstraction to use the context.Context object provided by Go Lang. The methods in wegocontext provide a key that can be used to get and set the values in context. The context.Context documentation recommends the use of a custom key to store and retrieve attributes in context. wegocontext provides such a key.

2. This package provides convenience methods that allows the getting and setting of specific keys and values. Eg:
```
wegocontext.SetPayload()
// allows the payload to be set in the context. 
wegocontext.GetPayload() 
// the Get methods retrieve the set values for specific objects within context without  the need for // casting.
```
3. Every attribute added to the context is remembered and can be retrieved using: 
```
    wegocontext.GetAllKeys(ctx)
```
4. wegocontext provides convenience methods to copy headers from and to http request to the context object.

5. wegocontext allows the generation of a trace ID for every request. 


