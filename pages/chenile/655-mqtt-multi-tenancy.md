---
title: Multi-tenancy with MQ-TT
keywords: chenile  mqtt Multi-tenancy
sidebar: chenile_sidebar
toc: true
permalink: /mqtt-multi-tenancy.html
folder: chenile
summary: How do we achieve multi-tenancy in Chenile MQTT?
---
Chenile supports a multi-tenant SaaS architecture. In this architecture, the cloud might be shared between multiple tenants. However, the edge will reside in places that are specific to a particular tenant. These edges will host different services as well. 

We don't want the edge that is specific to a particular tenant to even receive data (much less consume it) that belongs to other tenants. 

## The Design
We accomplish multi-tenancy by keeping the topics specific to a tenant. The edge will only subscribe to a tenant specific topic. It will not subscribe to other topics that belong to other tenants. Hence it only receives traffic that is specific to that particular tenant that it is servicing. 

The services should publish data that is specific to a tenant into the topic that is specific to the tenant only. The cloud will have access to all tenants and hence will consume traffic for all tenants. 

This is illustrated in the picture below:
[![MQTT Multi Tenancy](/images/chenile/mqtt-multi-tenancy.png)](/images/chenile/mqtt-multi-tenancy.png)

In the picture, you see services "foo" and "bar" that expose an operation "op". These services reside in multiple edges (Edge1,Edge2,Edge3) that are specific to particular tenants (tenant1 and tenant2). They also reside in the cloud. 

Subscriptions are determined by the combination of tenant and the type of service. For example, a service "foo" that resides in edge Edge1 (that belongs to tenant1) only subscribes to a combination of tenant1 and foo topic. 

These combinations ensure that data is not mixed up. They also ensure data security.

## Chenile Implementation
Chenile depends on two parameters to accomplish this functionality. They are "mqtt.publish.base.topic" and "mqtt.subscribe.base.topic". 

mqtt.publish.base.topic will be the base topic to which the service name (such as foo) and the operation name (such as op) will be appended when messages are published from chenile. This can be a constant value ('chenile' is the default). Hence in a non SaaS architecture for a sevice "foo" that has an operation "op", all messages will be published to 'chenile/foo/bar'. However, in case a SaaS architecture is desired, then the value of mqtt.publish.base.topic must contain an expression. For example, it can be "c/{x-chenile-tenant-id}". This will tell chenile to publish all messages destined for operation "op" in service "foo" for tenant "t1" to "c/t1/foo/op". (t1 will be the value of the x-chenile-tenant-id header) Any header value can be used in lieu of "x-chenile-tenant-id" to compute the topic name.

mqtt.subscribe.base.topic will be the base topic to which the service name (such as foo) and the operation name (such as op) will be appended to compute the subscribe topic to receive all messages. This varies between deployments. If service "foo.op" is deployed in edge Edge1 that belongs to tenant t1 then the base subscribe topic value must be "c/t1" so that all messages will then be received from "c/t1/foo/op". If the same service is deployed in an edge E2 that belongs to tenant "t2" then it must be set to "c/t2" so that we will receive all messages from "c/t2/foo/op". 

For the cloud deployments we want to subscribe to all tenants. Hence this value must be set to c/+. 
This will make the cloud to subscribe to c/+/foo/op. Hence it will receive messages from all tenants since "+" is a wildcard in MQ-TT. Thus, the value for mqtt.subscribe.base.topic will vary depending on where the software is deployed. 

By using these two values, Chenile is able to support multi-tenancy seamlessly.

