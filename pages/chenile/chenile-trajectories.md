---
title: Chenile Trajectories
keywords: chenile services trajectories
tags: chenile services trajectories
sidebar: chenile_sidebar
toc: true
permalink: /chenile-trajectories.html
folder: chenile
summary: Chenile - Trajectories. What are they and why are they useful?
---
In Chenile, a trajectory is defined as a path that is taken for fulfilling a request. Trajectories are computed in one of the first interceptors. By default, the trajectory is null i.e. the request is not treated in a special way. If it is determined that the request needs to be treated specially, the trajectory is computed and inserted into the request as a special header called "x-trajectory". 

This header is then used to make the distinction in the request processing in the chenile pipeline. 
## Why is there a need for trajectory?

There are multiple reasons to assign a trajectory for a request. 
### Tenant Specific Processing
Chenile supports multiple tenants. It is possible that a tenant requires special treatment. In that case, the trajectory ID indicates the tenant ID as well to make a distinction that this request emanated from this tenant and hence needs to be treated specially. 

Please note that most tenants need not be treated specially. Only specific tenants may need this processing. 

### A-B Testing
A user cohort is a set of requests that belong to users who are identified in a special way. For example, we can state that all users between ages 10 and 20 who are Male can belong to a cohort. Any attribute of the request can be used to identify a user cohort. The user cohort can also be random. e.g., 2% of users must belong to this cohort. 

Sometimes it would be desirable to treat a user cohort specially. In that case, users who belong to an identified cohort can be assigned a trajectory ID. 

## Trajectories need to be modular
Trajectory processing cannot be scattered throughout the service. It is possible that we might want to remove a trajectory after a time. (maybe because the tenant is no longer in our system or maybe we want to stop the A-B test). Hence trajectory processing needs to be in a separate module. If we remove the module, then the special treatment goes away!


### Chenile Trajectories & Services
Trajectories allow the service name to be over-ridden for specific requests. For example it is possible to specify that all users who are male 21 to 25 years are put into a particular test trajectory. This trajectory can have its own experimental implementation of the service. 

## Different Service Implementation
### The Strategy
In this case, we desire to write a new implementation of the service say _UserServiceT1Impl_ that is applicable for this particular trajectory. _UserServiceT1Impl_ implements the same interface _UserService_. This service will be exposed using the same URL. All requests to trajectory _t1_ will be routed to the new service

_UserServiceT1Impl_ can extend the default implementation _UserServiceImpl_. It is possible to write this implementation from scratch as well. 
The entire logic is put into a new module that exists only for trajectory _t1_. 
Contents of the module:
```java
  public class UserServiceT1Impl extends UserServiceImpl{
    // custom code that extends the base class methods
  }
  import org.chenile.core.annotation.ConditionalOnTrajectory;
  @Bean 
  @ConditionalOnTrajectory(id = "t1",service = "userService") 
  public UserService userServiceT1(){
  	return new UserServiceT1Impl();
  }

```

The ConditionalOnTrajectory annotation states that this bean definition replaces the _userService_ bean definition for trajectory _t1_. Chenile will check if the trajectory ID matches and will re-route all requests to this bean instead of _userService_. 
### Advantages
* Provides a modular way of customizing the service. The bean definition and instantiation is "discovered" only if the corresponding module is discovered. It is quite simple to get rid of this implementation by removing the module.

## Customizing the interface
Sometimes, the interface needs to be customized for a specific trajectory. For example, UserService might have to
accept additional information for trajectory _t1_. It might have to also return additional information. Let us take a new subclass of _User_ called _T1User_. 

The _UserService_ is still valid since _T1User_ can be accepted and returned in lieu of _User_. However, transformations can get tricky! The _T1User_ class needs to be created in lieu of _User_ from JSON. Chenile helps this out using the "bodyClass" abstraction which is discussed in [Chenile Transformation Framework](transform)