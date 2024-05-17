---
title: Cloud Edge Switch
keywords: chenile  cloud edge switch
sidebar: chenile_sidebar
toc: true
permalink: /cloud-edge-switch.html
folder: chenile
summary: Reuse the same service in the cloud and the edge. Handle internet being down at the edge using MQ-TT
---

When we write services, we want to focus on business logic. We don't want to make any assumptions on where the service is running. It can be running in the cloud or the edge. Chenile is all about enabling developers to focus on business logic and not be boggled with these kinds of concerns. The cloud edge switch was developed for some of our users keeping this in mind. 

## The Scenario
One of our customers has an Order Service. The order service's intent is of course to capture orders fulfill orders. They deplopyed this in the cloud. When the internet connection goes down, things got manual. They have to key these manual orders into the cloud when the internet connection restores itself. In this day and age, this does not obviously work. 

## The Solution Outline
The first rule of avaiability is redundancy. To make the order service more available we decided to run the same Order Service on the edge which in this case is the store. The store order service must handle the following:
1. When the internet connection is UP, delegate control to the cloud so that the cloud order service can handle the request.
2. When internet is DOWN, capture and fulfill orders locally.
3. Set up a queue so that these orders will eventually flow to the cloud order service when the internet connection is restored.
4. Since orders needed to be retrieved locally, all stores must have a copy of all the orders that were captured in the cloud. 

As can be seen, this will sadlle the Order Service with a lot of synchronization logic - logic that has nothing to do with Order Management. Also the same logic needs to be replicated for all services. This makes it quite difficult to implement. 

Chenile jumps to the rescue. We will first discuss some technical patterns in the impementation before jumping into the Chenile solution.

## Implementation using MQ-TT
As we have seen above, we will have two instances of the service one in the store and one in the cloud. The store service talks to the cloud service. The cloud service is not aware of specific stores. However, all the stores are aware of the cloud. We will also need a queue to store messages when the store is offline. Since the connection between store and cloud is unreliable we will need a message service that can handle this. MQ-TT (Message Queue Telemetry Transport) protocol is gaining traction to take care of unreliable message delivery. It is especially useful for IoT (Internet of Things). What works for IoT will definitely work for us. So we chose MQ-TT for storing and forwarding messages. 

## Chenile Support for MQ-TT
Chenile supports MQ-TT as a transport end point. What this means is that Chenile can receive messages from MQ-TT by subscribing to specific MQ-TT topics and trigger Chenile services using the content of these messages. It requires no changes on the service to avail this facility. All the service has to do is to register itself as an MQTT end point. It does so in the Spring HTTP Controller using a special annotation. Once it does this, Chenile listens to a topic and forwards messages to the service. Look Mom... no transport specific protocols in the service!

However, there is an additional problem. The service must still implement all the synchronization logic that we mentioned in the section above. That is where the Cloud-Edge-Switch comes into its own.

## Chenile Cloud-Edge-Switch
Chenile __cloud-edge-switch__ is implemented as a Chenile interceptor. It is called before the service is called. It calls the underlying service and implements the logic that we discussed above. We will see how it does this now.

[![Cloud Edge Switch](/images/chenile/cloud-edge-switch.png)](/images/chenile/cloud-edge-switch.png)

The above diagram clearly depicts the logic of the interceptor. Here is a brief description.
First of all, the switch only works when explicitly configured. Otherwise, it is as if it does not exist. 
### Cloud 
In the cloud, the underlying service is called. Upon successful completion, an MQ-TT message is broadcasted to tell all the stores to update themselves with the order.

### At the Edge
If it is getting an update via MQ-TT, the cloud interceptor does not do anything.
If however, the update is via HTTP, the requests are delegated to the cloud via HTTP. If there is no connection error, the response from the cloud is returned "as is". If there is a connection error, then the message is passed along to the local service. If the local service fails, then the error is returned back to the caller. However, if the local service stores this successfully, then an MQ-TT message is sent to the cloud to update itself. This message will get sent when the connection is re-established. 

## In Conclusion
We have seen how the Cloud edge switch transparently makes a service to run in both the cloud and the edge by adding a few annotations. 


