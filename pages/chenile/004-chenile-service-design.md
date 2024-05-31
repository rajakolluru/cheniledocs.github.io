---
title: Chenile Services
keywords: chenile services
tags: chenile services 
sidebar: chenile_sidebar
toc: true
permalink: /chenile-service-design.html
folder: chenile
summary: Chenile - Service Design
---
Chenile Services comply to certain design patterns. They are designed and registered in a special way so as to enable them to be discovered and treated by Chenile. 

The most important thing to know about Chenile services is that they are transport agnostic. Chenile supports new transports and protocols seamlessly. This is due to the fact that all Chenile service implementations are plain POJOs that are completely agnostic to transport specific objects. For example, a service does not need to rely on HttpServletRequest or HttpServletResponse. 

Chenile provides all the requisite context without relying on transport specific objects. It copies the transport specific entities to protocol agnostic domain objects. With that said, support natively supports HTTP since it relies on Spring Boot which has firm support for HTTP. Spring controllers are extended to define services. They are more than the entry point for HTTP interactions. They are service definitions in Chenile. We will look into these considerations in this article. 

## Service Specification
First and foremost, every service has a name. The name identifies it uniquely in the ecosystem. There is no notion of a namespace for the service. Hence service names must contain the necessary qualifiers to uniquely identify them in the ecosystem. For example UserCommandService may be a valid name for a service. 

A service is closely tied to a Java class but the notion of a service in Chenile is way beyond the class itself. The service implementation may be tied to a class but the service definition includes the following:
* **Protocol:** A service is tied to a protocol such as HTTP/Kafka etc. These serve as entry points to invoke the service.
* **URL:** In the context of HTTP, the service and operation may also be mapped to a URL. 
* **Health Checker:** An optional health checker can be defined for a service. This class is invoked when a health check is made for the service. The health checker returns a structure that specifies if the service is healthy.
* **Service Policies:** The Quality of Service is defined by service policies. Each policy may represent one service quality. For example, caching is a service quality that can map to a service policy. We will talk about Service policies in a [separate article](/chenile-service-quality.html). 
* **Trajectory Specialization:** The implementation of a service may be over-ridden at a trajectory level. For more information, see the article on [chenile trajectories](/chenile-trajectories.html). A health checker can also be over-ridden at the trajectory level.


## Operations & Parameters
Every service will need to have one or more operations. Operations are akin to methods in a service class. Operation has a name (which is the name of the method). Operations can have multiple parameters. Each parameter has a name and type. Type of the parameter can be HEADER or PAYLOAD. 

Since services are supposed to be invocable using a message, the service invocation will depend on the message. A message can have several headers and one payload. (Multi part payloads are not currently supported for service invocation) Hence among all the operation parameters, only one parameter can have type as PAYLOAD. The rest of them must be HEADER parameters. The Header name must correspond to the name of the parameter. 

For example consider the service class below: 
{% highlight java %}
package com.mycompany.myorg.user.impl;

import com.mycompany.myorg.user.User;
public class UserCommandServiceImpl implements UserCommandService {
	@Override public User create(String userType, User user){
		....
	}
}
{% endhighlight %}

In this class, the service name might be "userCommandService". The Operation is "create". It has two parameters userType and user. The type of UserType is HEADER and the type of user is PAYLOAD. 

### Param Types
paramTypes is the Java representation of the parameters. The paramType for userType is "java.lang.String" whereas the paramType of the user param is import com.mycompany.myorg.user.User. Most of these are derivable by looking at the _UserCommandServiceImpl_ class above. The whole thing looks straightforward and it is indeed so for the majority of the cases. But there are some edge cases as well that we will look later. 

## Service Interface, Package & Code Module
Services implement a public interface. There are no specific requirements about the interface. Typically it resides in a package called com.${company-name}.${org-name}.${service-name}.service. Service interface resides in a maven code module called ${service-name}-api. This code module also contains the model objects that are exposed by the service to the outside world. The packages are com.${company-name}.${org-name}.${service-name}.model for all the model objects. 

## Service Impl & Its Instantiation
The Service implementation resides in a code module called ${service-name}-service. It resides in a package com.${company-name}>.${org-name}.${service-name}.impl. The  ${service-name}-service code module is also responsible to instantiate the service using Spring. All spring configurations reside in one standard package called com.${company-name}.${org-name}.${service-name}.configuration. 

By enforcing these naming conventions, Chenile ensures that people can easily figure out where each service resides. We would caution against using any other Spring annotation (such as @Service or @Component) to instantiate the beans. All beans must be instantiated only using classes annotated with @Configuration. These services are instantiated using @Bean. 

If you use app-gen to generate this code, this is done by default in the generated code. 
The spring bean name for the instantiated service is stored in the service defintion so that Chenile knows to invoke the bean when the service is called.

## Service Registration
All Chenile beans must be registered in the Chenile registry. Please see [service registry](/local-service-registry.html) for notes on how to register a service in the service registry. 

## Health Checker
A service health checker is a class that does a health check and returns the health status of the service. It is defined as part of the Service definition in the service registry. A typical health checker is shown below:
{% highlight java %}
package com.mycompany.myorg.user.healthcheck;

import org.chenile.core.service.HealthCheckInfo;
import org.chenile.core.service.HealthChecker;

public class UserServiceHealthChecker implements HealthChecker{

	public static final String HEALTH_CHECK_MESSAGE = "UserService is fine!";

	// Implement a health checker for the service.
	// Check all the dependent systems, DBs etc. 
	@Override
	public HealthCheckInfo healthCheck() {
		HealthCheckInfo healthCheckInfo = new HealthCheckInfo();
		healthCheckInfo.healthy = true;
		healthCheckInfo.statusCode = 0;
		healthCheckInfo.message = HEALTH_CHECK_MESSAGE;
		return healthCheckInfo;
	}

}
{% endhighlight %}

The health checker can return a simple hard-coded message such as shown above. In this case, since the health checker resides in the same VM as the service, it is assumed that if the health checker is accessible, then the service is also accessible. Alternately, the health checker can do a deep health check to make sure that all the dependent systems such as DBs, Kafka topics etc. are checked before declaring that the service is healthy. 

## Service Policies
To complete the service definition, we should define the service policies. More information on the [service policies is found here](/chenile-service-policies.html)

## Trajectories
A service bean name can be over-ridden at a trajectory level. This is done using the support for trajectories in Chenile as [documented here](/chenile-trajectories.html).

