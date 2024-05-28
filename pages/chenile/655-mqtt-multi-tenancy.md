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