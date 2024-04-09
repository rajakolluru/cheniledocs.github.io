---
title: Service Policies
keywords: chenile  policy
sidebar: chenile_sidebar
toc: true
permalink: /chenile-service-policies.html
folder: chenile
summary: Chenile Service Policies
---

## Introduction to Service Policies
A service gets deployed and exposed to other services using transports such as HTTP. At the time of exposing a service, the policies need to be defined. Chenile ships with certain default policies for all its services. These can be over-ridden for a particular instance of Chenile. It can also be augmented at the company level or org level (within a company) or even  at the level of individual services or operations. Service level policies are especially useful for generic services that can be customized to do specific things by using configuration. 

## Defining the Service Policies
All service policies are defined at the time of registering a service into the service registry. Remember, it is not configured at the service bean level but at the service level. This means that there can be two services that use the same bean. This makes the services powerful. 

Service Policies are defined as configuration information. Each policy section has a name and specific configuration for a particular policy. E.g., Let us say we have a policy called Authorization that ensures that the user has the necessary permissions to invoke a particular service. This will work across all services but the permission to check needs to be configured at the service or operation level because the perms will change from service to service or can even vary at the operation level. I might need CREATE-ORDER permission to be able to call the OrderService.create() operation.

Chenile ships with its own INVM service registry. An external service registry provides the policy configuration for all services in the enterprise. This can make the service configuration accessible throughout the enterprise. 

For example, the API Gateway can consult the service registry and implement authentication or authorization policies. The service registry allows for auto-discovery for routing to different services as well.

Local service registries allow the implementation of service policies in the last mile. This is the easiest way to implement a service policy. In the case of last mile interception, the service registry is a bunch of data structures (POJOs in the Java world) that contain the service policy configurations. These can be accessed by the interceptors in the last mile. The interceptors can then do something about implementing the policy using the configurations. 

## Where to implement Service policies?
Service policies can be implemented in API Gateways, Service meshes or in the last mile.

## API Gateways
API gateways intercept all service requests that emanate from outside the company. They are typically used to implement the following policies:
1. Company wide service polices that need to be uniformly enforced throughout the company
2. Org specific policies if an org has its own instance of the API Gateway (discussed below)
3. Global routing rules that delegate to separate policies for different types of resources. e.g., static assets might have a different set of policies (related to caching for example) and hence need to be routed to CDN's that implement these policies.
4. Most importantly, API Gateways provide the first point of entry for outside requests. Hence they need to ensure proper sanitization of the request. 
5. API Gateways must implement authentication. 
6. Gateways must exist in their own subnets. These subnets must be able to access service subnets for all services that are fronted by the gateways. Consequently, the service subnets are protected from direct external access. The service subnets must also be protected from internal non white-listed subnets.
7. API Gateways can implement rate limiting for all partner requests that originate from the outside world. In addition to this, services might also have their own rate limiting requirements.
8. API Gateways can implement a preliminary level of RBAC - Role Based Access Control. This would be coarse-grained. However, some services can choose to configure the RBAC in the last mile and hence can bypass the gateway level RBAC

## Org Specific API Gateways
Orgs within a company can host their own internal API Gateways. These can be used to implement specific policies that are needed within the organization within the same company.

If org specific API Gateways are used, they can end up fronting the request at the company level or at the org level.  It is possible to use org specific API Gateways to front all requests for that particular org. In this situation, the entire burden shifts to org specific API gateway (in lieu of the company wide API Gateway)

## Service Mesh
Service mesh provides an additional layer of security. The Ingress and egress service meshes collaborate to create an ecosystem for enforcing org wide service policies. Typical service mesh policies include:
1. Request validation policies that allow for a basic service to service authentication for all internal services. In fact, even external requests are validated by the service mesh when the API gateway calls the service. Consumer ID validation can be one of these policies. 
2. Rate limiting policies for service to service communication. e.g, enforce different rate limits for different consumer ID's.
3. Circuit breaking and Retry functionality. 

Service meshes are enforced at the company level. Hence it is not possible to customize these with specific policies for a service or org. 

## Last Mile Interception
Service policies can also be implemented at the last mile i.e. within the service deployable itself. This provides for highly distributed approaches for service policies. Common configurations for different services can still percolate from the organizations. However, all these can be customized in the last mile. 

Last mile interception can implement the following:
1. Customized authorization either for RBAC or ABAC. 
2. Service selection policies that allow for different service implementations for different request trajectories. A request can be segmented into different trajectories depending on request attributes such as request origin, the cohort of the requester, A-B testing policies etc.
3. Other org wide service policies that can apply for a bunch of related services.
4. Service specific policies. 





 


