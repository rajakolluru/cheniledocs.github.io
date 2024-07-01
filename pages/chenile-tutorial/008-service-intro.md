---
title: Introduction to Chenile Services
keywords: chenile tutorial services
sidebar: tutorial_sidebar
toc: true
permalink: chenile-generating-microservice.html
folder: chenile-tutorial
summary: Chenile Services 
---

# The Structure
To recap, here is the service structure that was generated:

```
.
├── Makefile
├── make.autocomplete
├── pom.xml
├── s1-api
│   ├── pom.xml
│   └── src
│       └── main
│           └── java
│               └── com
│                   └── yourcompany
│                       └── yourorg
│                           └── s1
│                               ├── model
│                               │   └── S1Entity.java
│                               └── service
│                                   └── S1Service.java
├── s1-service
│   ├── pom.xml
│   └── src
│       ├── main
│       │   ├── java
│       │   │   └── com
│       │   │       └── yourcompany
│       │   │           └── yourorg
│       │   │               └── s1
│       │   │                   ├── configuration
│       │   │                   │   ├── S1Configuration.java
│       │   │                   │   └── controller
│       │   │                   │       └── S1Controller.java
│       │   │                   └── service
│       │   │                       ├── healthcheck
│       │   │                       │   └── S1HealthChecker.java
│       │   │                       └── impl
│       │   │                           └── S1ServiceImpl.java
│       │   └── resources
│       └── test
│           ├── java
│           │   └── com
│           │       └── yourcompany
│           │           └── yourorg
│           │               └── s1
│           │                   ├── SpringTestConfig.java
│           │                   └── bdd
│           │                       ├── CukesRestTest.java
│           │                       └── CukesSteps.java
│           └── resources
│               ├── com
│               │   └── yourcompany
│               │       └── yourorg
│               │           └── s1
│               │               ├── TestService-chenile.properties
│               │               └── TestService.properties
│               ├── features
│               │   └── service.feature
│               └── version.txt
├── scripts
│   ├── curl-scripts.sh
│   ├── increment-tag.sh
│   ├── make-hotfix-branch.sh
│   └── merge-hotfix-to-master.sh


```

# Service Parent
The parent _pom.xml_ contains the service configuration. It has a few features of interest:
1. It inherits from chenile-parent. We need to make a commitment here for the appropriate Chenile version that the service depends on. The rest of the versions flow from there. Look at [mvnrepository.com](http://mvnrepository.com) for finding the current chenile version.
2. The service pom also executes the other poms under it. In this case, it execures both s1-api and s1-service which are registered as maven modules.
3. The service pom initializes the version to ${revision}. This de-couples the version from the GIT. However GIT repository will be used to store the latest version (in the form of the tag). We sill discuss this later in the [dev ops part](/chenile-devops.html)
4. The service pom also initializes a variable called s1.version to the version of the service.
5. s1.version is used to define dependency management for s1-api and s1-service. This ensures that the s1-api and s1-service modules can seamlessly depend on each other without stipulating the version. Foe example, in s1-service/pom.xml, we don't need to define the version for s1-api. 

# API module
The API module contains all the information to consume the s1 service. For example, if there was a service s2 that depended on s1, then the s2 service needs to include s1-api in its pom. 

API has two packages to begin with: 
* com.yourcompany.yourorg.s1.model that contains all the model classes.
* com.yourcompany.yourorg.s1.service that contains the Service interface

The API can depend on other API packages for defining the model objects.

# Service Module
The service module contains implementations of the interface. The service module will depend on the API module since it needs to implement the interface that is defined there. 

The service might depend on other services (more specifically the api modules of other services). Here are the important packages:
* com.yourcompany.yourorg.s1.configuration - this contains a Spring @Configuration class that instantiates all the classes. 
* com.yourcompany.yourorg.s1.configuration.controller contains the service class which will be discussed more 
* com.yourcompany.yourorg.s1.service.healthcheck which contains a health checker class for the service
* com.yourcompany.yourorg.s1.service.impl that contains the actual service implementation.

## Configuration package
The com.yourcompany.yourorg.\*\*.configuration is in the scan path of the Spring Boot application. Hence the configuration and controller classes get automatically discovered. In Chenile, we will avoid accidental discovery by restricting the scan packages to designated packages. 

## Service package
The service package contains the service impl and the health checker class. Service Impl is responsible for implementing functional requirements. Health check is supposed to do a deep probe to determine if the service can run. Chenile encourages every service to have a health check. The health check can be used by automatic diagnostic tools to determine if an instance should be shut down because it is not operational.

# Controller vs. Service Separaration
Chenile services are merely responsible for implementing functional requirements. The horizontal requirements are implemented as service policies using interceptors available in the Chenile interception framework. These need to be "hooked up" to the service when it is invoked so that the service can be deployed with policies. To achieve this, Chenile has customized the Spring controller class. The usual Spring annotations are supplemented by Chenile custom annotations. We will eventually discuss all of them. But for now, we need to be concerned about the basic annotation that marks a service as an Chenile service.

Let us discuss the service and health checker classes first.
# Service 
The service impl is nothing special. It is like any class that implements business logic and provides an implementation of the Service interface. The sample class S1ServiceImpl merely sets the ID in the entity to its class name and returns the same object. Here it is shown below:
```java
public class S1ServiceImpl implements S1Service{
	@Override
	public S1Entity op1(S1Entity s1Entity) {
		// Implement the service here
		s1Entity.id = "S1ServiceImpl";
		return s1Entity;
	}
}
```

# Health Checker
All service health checkers must implement the HealthChecker interface. A sample implementation of health checker is shown below:
```java
public class S1HealthChecker implements HealthChecker{
	public static final String HEALTH_CHECK_MESSAGE = "S1 is fine!";
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
```
The interface can either return an instance of HealthCheckInfo or its subclass.

# ChenileController
Chenile, the framework that powers Chenile interception, has an annotation called @ChenileConteoller that marks a controller as a Chenile Controller. Here is a quick snippet of a Chenile Controller.
```java
@RestController
@ChenileController(value = "s1Service", serviceName = "_s1Service_",
		healthCheckerName = "s1HealthChecker") 
public class S1Controller extends ControllerSupport{
	
	@PostMapping("/s1/op1")
	public ResponseEntity<GenericResponse<S1Entity>> op1(
			HttpServletRequest httpServletRequest,
			@RequestBody S1Entity entity){
		return process("op1",httpServletRequest,entity);	
	}
}
```
In the above, the @ChenileController defines a Chenile Service with a unique ID(as mentioned in the value attribute), a serviceName for doing a look up in Spring and a health checker service name that can be invoked when the health checker is invoked. A mock service name can also be used if you desire to run the service in a "mock mode" where it might not implement functionality but returns expected results.

All Chenile Controllers can inherit from ControllerSupport. ControllerSupport provides the necessary plumbing to invoke the Chenile interception framework. 

All the methods in the Controller class must mirror the methods in the corresponding Service interface in name and the number of arguments except for a couple of caveats. One is that the methods in the controller must always accept HttpServletRequest as the first parameter. The second is that the other parameters must specify the mapping between the parameter and the http request. It must mention whether the parameter is received as a header, path param, request param or request body. This is a regular Spring controller mapping.

Finally, all controller methods must call the var-args process method. The first parameter is the name of the method, the second one is the http request and the rest of the parameters are the same as what was received by the controller method. 

# Service Registry
Chenile internally hosts a mini service registry. The registry contains the information about all the Chenile services that are hosted within the current mini monolith. This information is stored using Java structures. It can easily be rendered in a custom JSON format and an Open API format. These will be discussed as part of the [mini monolith tutorial](/chenile-generating-minimonolith.html). 

# The Testing packages
Chenile testing packages will be discussed in the [Chenile testing framework tutorial](chenile-testing-tutorial.html)









