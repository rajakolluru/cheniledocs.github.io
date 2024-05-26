---
title: Cloud Edge Switch
keywords: chenile  cloud edge switch
sidebar: chenile_sidebar
toc: true
permalink: /cloud-edge-switch.html
folder: chenile
summary: Reuse the same service in the cloud and the edge. Handle internet being down at the edge using MQ-TT
---

When we write services, we want to focus on business logic. We don't want to make any assumptions on where the service is running. It can be running in the cloud or the edge. Chenile is all about enabling developers to focus on business logic and not be boggled with these kinds of concerns. The cloud edge switch was developed keeping this in mind. 

## The Scenario
One of our customers has an Order Service. The order service's intent is of course to capture and fulfill orders. They deployed this in the cloud. When the internet connection goes down, things got manual. They have to key in these manual orders into the cloud when the internet connection restores itself. In this day and age, this does not obviously work. How does the store become more available? 

## The Solution Outline
The first rule of availability is redundancy. To make the order service more available we decided to run the same Order Service on the edge which in this case is the store. The store order service must handle the following:
1. When the internet connection is UP, delegate control to the cloud so that the cloud order service can handle the request.
2. When internet is DOWN, capture and fulfill orders locally.
3. Set up a queue so that these orders will eventually flow to the cloud order service when the internet connection is restored.
4. Since orders needed to be retrieved locally even if the internet connection is DOWN, all stores must have a copy of all the orders that were captured in the cloud. 

As can be seen, this will sadlle the Order Service with a lot of synchronization logic - logic that has nothing to do with Order Management. Also the same logic needs to be replicated for all services such as product service, user service etc. This makes it quite painful to implement. We want the solution to be generic and work for all services. 

Chenile jumps to the rescue. We will first discuss some technical patterns in the implementation before jumping into the Chenile solution.

## Implementation using MQ-TT
As we have seen above, we will have two instances of the service one in the store and one in the cloud. The store service talks to the cloud service. The cloud service is not aware of specific stores. However, all the stores are aware of the cloud. We will also need a queue to store messages when the store is offline. Since the connection between store and cloud is unreliable we will need a message service that can handle this. MQ-TT (Message Queue Telemetry Transport) protocol is gaining traction to take care of unreliable message delivery. It is especially useful for IoT (Internet of Things). What works for IoT will definitely work for us. But is MQ-TT reliable? We found that MQ-TT providers have to provide for a certain Quality of Service (QoS). At QoS = 2, MQ-TT provides for guaranteed delivery wherein each subscriber gets every message once and only once. This made MQ-TT a good choice to implement our Order Management solution. 

We want to use MQ-TT only for asynchronous requests not for LIVE requests i.e. if we want the Cloud to immediately process an Order, we don't use MQ-TT. We instead use HTTP which we know works reliably for synchronous communication. 

## Design Principles
1. The cloud service is well-known i.e. all the store services know how to reach the cloud.
2. The cloud service does not know about the different edges. It communicates with the edges using messages that are sent to the MQ-TT broker. The broker in turn, sends the requests to all the edges that have subscribed to that type of message. 
3. All end devices (such as UI, apps etc.) talk to edge services only. They only communicate to the cloud in the absence of an edge service that is close to them. Devices that interact with the cloud directly are prone to be DOWN if the internet connectivity is down.
4. If the edge can communicate with the cloud, then it delegates all its requests to the cloud. It does not even process them. It expects the cloud to notify it later if the cloud has successfully processed the message. This ensures that all requests are processed by the cloud which is assumed to be running the current version of the software and has all the current validations.
5. The cloud, upon successful completion, notifies all the edges by sending a message (as mentioned in point 2 above). 
6. If the edge cannot communicate with the cloud, then it handles the request locally and only notifies the cloud. All other edges are supposed to ignore this request that emanated from the store. They only process the message if it comes from the cloud. 
7. When the cloud gets an MQ-TT request from the store (as opposed to a HTTP request), it processes it regularly. But, when it notifies all the stores, it makes sure that the store that emanated the request does not process it. 

## Design Implementation
Each topic in MQ-TT services a service and an operation. The topic name is formatted as follows: {base-topic-name}/{service name}/{operation name}. The base topic name can be thought of as a constant (such as "chenile") for the purpose of this article. There are nuances that will be discussed in another article. Service name and operation name will be replaced by the name of the chenile service and operation.

If a service "foo" with operation "bar" needs to be serviced at both the cloud and the edge, then both the cloud and edge will subscribe to {base-topic-name}/foo/bar. 

### The Source and Target headers
There are special headers that will be used additionally. These go as user properties as part of the MQ-TT message. The names of the headers are "source" and "target". These headers are set to the client ID of the MQ-TT client. "source" will be set to the client ID of the publisher of the message. "target" will be set to the client ID of the intended target subscriber of the message. If the "target" header begins with "!" then it means that every subscriber other than the subscriber with the client ID specified, must process this target. 

### Interactions
#### Type 1: Cloud notifying all the edges to update themselves
In this case, the cloud sends a message with no "target" and source = "cloud client ID". This will prevent the cloud from updating itself (remember the cloud has subscribed to the same topic and hence will get its own message as well). The cloud will spot the "source" header and compares it to its own client ID. Since they will match it will not update itself. However, all the edges will update themselves since the target is not specified. (hence all subscribers must update themselves)

#### Type 2: Edge notifying the cloud to update itself
Edge sends a message to the topic with source = "edge name" and target = "cloud client ID". When this message is received the cloud (and only the cloud) will update itself since the target matches its client ID. All the edges will ignore this message.

### Type 3: Cloud notifying all the edges to update themselves (except the edge that sent the message to the cloud)
When the cloud updates itself due to an MQ-TT message from the edge, it sends the same message to the topic. The source will be "cloud client ID" and the target will be "!original-source-of the message". All the edges will update themselves by seeing this message except the edge which sent the original message. In this way, the message would have propagated itself fully. 

## Scenarios
The following scenarios cover how a message is propagated everywhere:

|Scenario|Trigger|What happens?|
|--------|------|--------------|
|1|Message comes to the cloud|Cloud sends Type 1 message. All edges update themselves|
|2|Message comes to an edge. Internet is UP|Edge deflects the message to the cloud via HTTP. Scenario 1 is effectively replayed|
|3|Message comes to an edge. Internet is DOWN|Edge updates itself. Sends interaction type 2 message to the cloud. Cloud updates itself and sends interaction type 3 message to all the edges. All edges except the originating edge update themselves|


## Detailed Implementation - A recap
So here is the outline of the solution using HTTP and MQ-TT.
1. All devices (such as POS terminals) talk only to a Store Order Service. They don't talk to the cloud. The Store order service exists in the same Wifi network and hence is expected to be available throughout the time the store is open. 
2. When the internet is UP, the Store Order Service communicates to the Cloud Order Service using HTTP. It passes the Order there. The cloud order service will persist the Order if it is valid. If the Order is invalid, it fails. The store order service communicates the error back to the POS. 
3. In case the Cloud Order Service succeeds, it sends an MQ-TT message with source=cloud. All subscribers will receive this message including the cloud itself. However, when the message is received, the cloud order service recognizes that the source is the cloud itself and hence does not create a duplicate request for the service. The other stores update themselves. 
4. When the internet is DOWN then the cloud service cannot be contacted. The store service will locally store the order. Upon successful execution, a message will be sent via MQ-TT to the cloud (target = cloud, source = storename). This will ensure that only the cloud will update itself when it receives the MQ-TT message. (after the internet connection gets re-established)
5. After the internet gets UP the message will be sent. The cloud receives this message and updates itself. It sends the MQ-TT message to everyone else with source=cloud and target = !source store name so that the cloud itself and the origin store do not update themselves again. All the other stores update themselves. 
[![Edge cloud activity](/images/chenile/edge-cloud-activity.png)](/images/chenile/edge-cloud-activity.png)


## Chenile Support for MQ-TT
Chenile supports MQ-TT as a transport end point. What this means is that Chenile can receive messages from MQ-TT by subscribing to specific MQ-TT topics and trigger Chenile services using the content of these messages. 
The content of this message consists of the payload which is the payload of the request. Header parametes are derived from User Properties that are supported by MQ-TT. Each user property consists of a name-value pair that acts as a header name and header value.

Chenile MQ-TT requires no changes on the service. All the service has to do is to register itself as an MQTT end point. It does so in the Spring HTTP Controller using a special annotation. Once it does this, Chenile listens to a topic and forwards messages to the service. Look Mom... no transport specific protocols in the service! 

Chenile also supports the source and target headers to avoid duplicate messages as discussed in the previous section. They are summarized in the table below:

|Header name| Possible Values | Description|
|-----------|-----------------|------------|
|source | the MQTT client ID for the source of the message | Since the source of the message might have also subscribed to the same topic, this header will prevent the source from updating itself again thereby creating unnecessary database duplicates|
|target | the MQTT client ID of the target of the message| If this header is set, then only the target will consume this message. Others will not consume this message even though they might have subscribed to the same topic|
|target| ! followed by the MQTT client ID| This is the client that should not consume this message. Everyone else can consume this message |

Thus, the MQTT module allows Chenile services to consume MQ-TT messages seamlessly without requiring any code changes. 

## Who implements the Synchronization Logic

The service must still implement all the synchronization logic that we mentioned in the section above. This can lead to the services becoming extremely complex. We wanted to avoid this. That is where the Cloud-Edge-Switch comes into its own.

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


