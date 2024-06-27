---
title: Chenile Multi Tenancy
keywords: chenile  multi-tenant
sidebar: chenile_sidebar
toc: true
permalink: /chenile-multi-tenancy.html
folder: chenile
summary: How do we view multi tenancy in Chenile? A discussion of strategies.
---
The ability to host multiple tenants with the same code base with or without necessitating multiple deployments. The tenant specific customizations must live within the tenant and not within the base code. The base code must implement the SOLID Open Closed Principle (OCP) - Open for Extension Closed for Modification.

Each tenant code must be in its own specific module. The tenant module must depend only on the base module. The features of the tenant specific module must be "discovered" during runtime. If the tenant module were to disappear the specific features will simply disappear without affecting the rest of the code base.

## Routing
Code must support routing at the URL or individual component (strategy) level.

### Gateway Routing
The easiest way is to route to specific URLs from Gateway based on certain cookies (or HEADERS) in the request. However, this kind of routing implies that the deployments are separate. Gateway will route to the correct deployment automatically. In that case, it is not a multi-tenant deployment. It is a single client deployment which needs to only contain code that caters to the tenant in question. This is quite trivial. But it can be useful if tenants are "noisy" i.e. they hog so much of resources that it is best to decouple them from others. Even in this case the code base must be structured to be reusable across tenants. 

### Strategy Based Routing
In this form, the routing happens to specific classes that implement specific strategies. This will be true multi-tenancy and does not mandate tenant specific deployments. There are multiple ways of achieving this. 

#### Factory & Strategy Pattern
In this case, there must be a factory for every Strategy. New components will need to be discovered by these factories. The factories cannot have compile time knowledge of all the possible implementations for a given Strategy. This ensures that as new tenant-specific implementations get discovered, the code is able to delegate to these. There must be a fallback implementation of a Strategy which will be used if there is no customization done for a specific tenant. 

#### Micro Orchestrations
Sometimes, it is best to kick off an entire chain of code for specific tenants. This is possible if you use a micro orchestrations framework. This framework allows an entire chain of components to be invoked for a particular tenant. This avoids the need to surround every strategy with a Factory and instead invokes an entire chain of strategies which is specific to a tenant. Please see how [the Chenile Orchestration Wizard(OWIZ)](/chenile-owiz.html) can help in implementing this. 

 