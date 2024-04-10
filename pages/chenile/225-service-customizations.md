---
title: Chenile Service Customizations
keywords: chenile  customization A-B
sidebar: chenile_sidebar
toc: true
permalink: /chenile-customization.html
folder: chenile
summary: Chenile - Customizations
---

## Service Customizations
Chenile backend treats every request as belonging to a unique trajectory. There is a header that is typically called as "x-chenile-trajectory-id" that denotes the trajectory of a particular request. This can be null if there is no particular trajectory that is applicable i.e. the default implementation is used for this request. Requests to Chenile services can be assigned unique paths based on the trajectory ID. Trajectories need to be computed using custom interceptors. These interceptors can assign a unique trajectory to a request based on considerations such as request origin, user cohorts, country, regions etc. 

Chenile backend allows multiple ways to customize a service per trajectory. These are discussed below in the context of a user service that needs to be customized for a trajectory _t1_ . The user service is exposed at URL _api.walmart.com/users_. Let us say that the user service is fronted by an interface called _UserService_ with a default implementation in class _UserServiceImpl_. In Spring, the user service impl is instantiated using a bean named _userservice_ 

```java

  public class User {...}
  public interface UserService {
    public User getById(String id);
    public User save(User user);
  }

  public class UserServiceImpl implements UserService {
    public User getById(String id){
      // custom code to retrieve user
    }
    public User save(User user){
      // custom code to save the user
    }
  }
  @Bean public UserService userService(){
  	return new UserServiceImpl();
  }

```

The following strategies are possible and discussed below.

## Different End Points
### The Strategy
Expose the service using a new end point. 
We will merely generate it as if it is a new service and expose it using a new URL say, api.mycompany.com/t1/users. Clients will invoke the new URL. It is also possible to use the same external URL and have a Gateway route to the correct internal URL based on the trajectory t1. 

In this implementation, Chenile does not play any role. The client either knows about the new URL or the upstream systems route to the correct internal URL keeping the external URL constant. 
### Advantages
* Simplicity
* Works with simple use cases. 
### Disadvantages
* The client or an upstream system such as Gateway needs to know how to compute the trajectory of the request. 
* The client or the upstream system needs to be aware of every implementation of the service for all trajectories and then invoke the correct one. This logic can potentially be scattered across the enterprise.
* This is not a modular implementation as it requires too much knowledge of all possible implementations. Hence removing an experimental trajectory _t1_ will require considerable amount of clean up. 



