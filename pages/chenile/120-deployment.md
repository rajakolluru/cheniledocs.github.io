---
title: Chenile Deployment Model
keywords: chenile  deployment
sidebar: chenile_sidebar
toc: true
permalink: /chenile-deployment.html
folder: chenile
summary: Chenile - Deployment Model
---

# Chenile Typical Deployment Architecture
Chenile supports and advocates a few infra components such as API Gateway and API registry. Besides these, individual services will be hosted separately. Chenile recommends the usage of recommended infra practices to ensure scalability. 


# Service Recommendations 
Chenile recommends that several cohesive services be packaged together into a “mini monolith” which is a unit for deployment. The advantages of having a separate mini monolith (as opposed to hosting every service separately) are:
* Reduced infra footprint
* Architectural simplicity & easier maintenance
* Shared approach to service policies
* Separation of deployment from development. 

# Core Chenile Features (to reduce number of deployments)
Chenile provides the following strategies and features to reason about deployments in a de-coupled fashion:

## Library Management
Chenile recommends that a service must be implemented by separate libraries. Multiple service libraries will be deployed together in a single mini monolith. The library versions must be managed together. 

## Location Transparency
Services must not assume the location of their dependencies. For example, if service1 depends on service2 then service1 code must not assume the location of service2. It might be possible that service2 is colocated with service1 or it might be hosted separately. Service1 code must work both ways. 
[Chenile Proxy](proxy) facilitate this strategy

# Deployment Cohesiveness
Deployments need to be cohesive i.e. associated services must be packaged together whilst unrelated services must be separated out into their own deployments. Here are some criteria to separate the services out into their own deployments:

## Velocity of Change
If services change at a different pace then it is better to separate out the deployments so that relatively stable services are not affected and don't have to be tested for every change. 

## Scalability
If services have different scalability needs, then they need to be separated out. Scalability dictates the infrastructure needs. If infra needs for services are not the same, then it will make sense to separate out the deployments.

## Domains
Non-Cohesive services across different domains must be separately hosted.

## Org Structure
Conway's Law states that the artifacts created by an organization mirror the org structure. 
Accordingly, if services belong to different orgs they must be hosted separately. This facilitates org autononomy.


![Deployment Architecture](/images/chenile/deployment.png)






