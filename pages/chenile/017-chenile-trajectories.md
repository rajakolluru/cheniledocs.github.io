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
{% include note.html content="Interested in a Trajectory tutorial for Chenile? Go to <a href='chenile-trajectories-tutorial.html'>this tutorial page.</a>" %}

In Chenile, a trajectory is defined as a path that is taken for fulfilling a request. Trajectories are computed in one of the first interceptors. By default, the trajectory is null i.e. the request is not treated in a special way. If it is determined that the request needs to be treated specially, the trajectory is computed and inserted into the request as a special header called "x-trajectory". A trajectory is assigned only if a particular request needs to be treated differently. Else the trajectory ID will be null. 

The trajectoru header is used to make a distinction in the request processing in the chenile pipeline. 
## Why is there a need for trajectory?
A trajectory ID implies that the request processing must be special for a request. There are multiple reasons to assign a trajectory for a request. 
### Tenant Specific Processing
Chenile supports multiple tenants. It is possible that a tenant requires special treatment. In that case, the tenant is assigned a special trajectory ID to give this tenant a special treatment for a selected set of services. (Remember that most services may not be customized for one tenant)

Also note that most tenants need not be treated specially. Only specific tenants may need this processing in a multi-tenant ecosystem. 

### A-B Testing
A user cohort is a set of requests that belong to users who are identified in a special way. For example, we can state that all users between ages 10 and 20 who are Male can belong to a cohort. Any attribute of the request can be used to identify a user cohort. The user cohort can also be random. e.g., 2% of users must belong to this cohort. 

Sometimes it would be desirable to treat a user cohort specially. In that case, users who belong to an identified cohort can be assigned a trajectory ID. 

## Chenile Trajectories are modular!
Trajectory processing cannot be scattered throughout the service. If it is distributed all over the place, it becomes hard to remove a trajectory. Hence trajectory processing needs to be in a separate code module. If we remove the code module, then the special treatment goes away! 

### Chenile Trajectories & Services
Let us say we want to over-ride the _UserServiceImpl_ for trajectory t1. In this case, we desire to write a new experimental implementation of the service say _UserServiceT1Impl_ that is applicable for this particular trajectory. _UserServiceT1Impl_ implements the same interface _UserService_. This service will be exposed using the same URL. To accomplish this, write a new code module for trajectory t1 called user-t1. This new code module would be packaged only if the special treatment for t1 is required. 

In the user-t1 code module, write the new implementation _UserServiceT1Impl_ 
```java
  public class UserServiceT1Impl implements UserService{
    // custom code that implements UserService for trajectory t1
  }
```java

Next instantiate UserServiceT1Impl in a @Configuration class within the same code module user-t1

```java
  import org.chenile.core.annotation.ConditionalOnTrajectory;
  @Bean 
  @ConditionalOnTrajectory(id = "t1",service = "userService") 
  public UserService userServiceT1(){
  	return new UserServiceT1Impl();
  }

```

The ConditionalOnTrajectory annotation states that this bean definition replaces the _userService_ bean definition for trajectory _t1_. This is only discovered when user-t1 code module exists in the classpath. 

For every request, Chenile will first check if the trajectory ID matches the current trajectory. If it does, Chenile will re-route the requests to this bean instead of _userService_. 

This provides a modular way of customizing the service. The bean definition and instantiation is "discovered" only if the corresponding module is discovered. It is quite simple to get rid of this implementation by removing the code module from the package. Chenile allows even the health check to be customized by using the @ConditionalHealthCheckOnTrajectory annotation for the trajectory specific health check class.

## Customizing the interface
Sometimes, the interface needs to be customized for a specific trajectory. For example, UserService might have to
accept additional information for trajectory _t1_. It might have to also return additional information. Let us take a new subclass of _User_ called _T1User_. 

The _UserService_ is still valid since _T1User_ can be accepted and returned in lieu of _User_. However, transformations can get tricky! The _T1User_ class needs to be created in lieu of _User_ if a request is made for trajectory t1. Chenile helps this out using the "bodyClass" abstraction which is discussed in [Chenile Transformation Framework](transform). We will illustrate this situation in a separate tutorial on trajectories. 