---
title: Location Transparency & Inter Process Communication
keywords: chenile  proxy
sidebar: chenile_sidebar
toc: true
permalink: /chenile-ipc.html
folder: chenile
summary: Chenile - Inter Process Communication
---
## Location Transparency
Chenile supports a true micro services architecture with services viewed as code modules rather than deployable units.
The services are individually developed and tested by developers without them being aware of the deployment decisions
that would be taken. This gives us a few advantages:
1. Developers don't have to worry about deployment decisions. They have to develop service moduliths.
2. Deployment concerns are separately addressed by a separate team. They design mini monoliths with one or more services
   Each mini monolith is individually deployed using a deployment strategy that consists of helm charts, KEDA configurations,
   Docker image configurations, Auto scaling strategies etc. These should not affect development teams. The standards for
   these configurations are contained in their own deployment blueprint.

This demands a few things from the ecosystem.
1. Developers must be able to unit test their code without needing deployments. Chenile supports a BDD infrastructure
   that flexibly supports testing. This is covered in a separate document.
2. Developers must be able to invoke their dependent services without being aware of where they are deployed. Otherwise,
the same services need to be rewritten for every new deployment. 

This requirement is called __location transparency__ 
> The caller must be unaware of whether the called process is local or remote to it. 

### How do we achieve this?

Chenile presents a few solutions that are slightly different depending on various factors that we will discuss here.

## Interface Awareness, Synchronous Communication  & Chenile Proxy
When a Service1 invokes Service2 in a synchronous manner, it knows the interface of Service2. The interface might be owned 
by Service2 or Service1. Irrespective of that, the awareness of the interface is essential for synchronous interactions. 
Chenile provides a utility called _chenile_proxy_ that returns a proxy which dynamically implements the interface. 
The proxy implementation that is returned by chenile-proxy must be marked @Primary in spring so that even if the service 
exists in the same JVM, the proxy takes precedence over the actual service. 

The proxy senses where the service is actually running. It delegates to the actual service if the service is running
in the same JVM. Else, it looks up the HTTP URL for that service and invokes it using HTTP during runtime. 

This proxy allows us to achieve location transparency since it insulates the caller from knowledge of where the called
service exists. 

### Service Registry
chenile-proxy requires awareness of service deployments across multiple deployables. This requires that Chenile Service
Registry must be running in the ecosystem. Service Registry is discussed in a separate document.

## Asynchronous Communication via Messaging
All asynchronous communications happen with messaging. The caller must be aware of the message model that is expected
by the called service. In addition to this, the called service may also expect some headers to be passed to it. These 
headers need to be explicitly set by the caller. 

Chenile provides a way to communicate via messaging in different ecosystems using a utility called AsynchMessageSender. 
The AsynchMessageSender is defined as an interface in a generic chenile module called _chenile-pub-sub_. This interface
insulates the caller from the nuances of the actual type of messaging that is used in the ecosystem. This also allows 
the testing to be done using one type of messaging whilst the production uses a different type of messaging. For example,
it is possible to test the communication using _RabbitMQ_ in unit testing and _Azure MQ_ in production.

### Local Asynchronous Messaging 
As per Chenile's recommendations, both local and remote asynchronous communications must be accomplished using messaging.
This strategy allows the messaging queue to control the throttling of the messages, the concurrency of the message 
receivers, auto-scaling of the receivers etc. Systems such as KEDA (Kubernetes Event Driven Architecture) can be 
seamlessly used with messaging. 

Thus, we achieve location transparency in asynchronous communication by using messaging for both local and remote services. 

## Local Messaging
We end this document with one final feature - local messaging. Chenile supports a unique messaging model via local 
messaging within the same JVM. This is only useful in extremely specific situations by people like authors of new 
Chenile modules. These situations are explained below:

### @EventsSubscribedTo
Let us say, you want to write a new transport and expose that in Chenile. For example, let us say we want to write 
a messaging module such as _chenile-kafka_. You would know that when you receive the message locally, you want to 
consume it locally in the same JVM. For these kinds of local interactions, Chenile provides a utility called _EventProcessor_.
This utility is used to send a message (with an event name) in the local JVM. The message will be received by all 
subscribers to this event. The subscribers subscribe to this event using a special annotation called @EventsSubscribedTo().
This isolates the receivers of events from a messaging protocol. Using this enables an event subscriber to subscribe 
to the event whether it has been dispatched using multiple protocols such as RabbitMQ, Azure MQ, Kafka etc. 

Chenile also uses the same event paradigm to allow subscriptions to a FileWatch event or Scheduling event. Hence, the 
@EventsSubscribedTo provides a powerful mechanism to receive multiple types of events irrespective of the origin of such
events. This is not IPC per se. But it is a useful paradigm. 

## Summary of Chenile IPC
Let us summarize the Chenile Inter Process communication using one table:

| Where  | Messaging? | Synch/Asynch | Strategy              | Description                                                                                                                                        | Is location transparency supported |
|--------|------------|--------------|-----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------|
| Local  | No         | Synch        | Use chenile-proxy     | Use an interface and treat it the same way if it is local or remote                                                                                | Yes                               |                               
| Remote | No         | Synch        | Use chenile-proxy     | Use an interface and treat it the same way if it is local or remote                                                                                | Yes                               |
| Local  | Yes        | Synch        | EventProcessor        | Event Processor must be used only when it is clear that it is a local interaction                                                                  | No                                |
| Remote | Yes        | Synch        | Use chenile-proxy     | This happens when a web hook with a known interface needs to be called from Chenile. Chenile proxy does not support Non chenile services currently | No                                |
| Local  | Yes        | Asynch       | Use AsynchEventSender | Even though the receiver is local it is expected to receive the message from MQ                                                                    | Yes                               |
| Remote | Yes        | Asynch       | Use AsynchEventSender | MQ Message driven bean or Kafka Listener                                                                                                           | Yes                               |