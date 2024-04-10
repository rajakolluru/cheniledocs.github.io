---
title: Chenile Trajectories Tutorial
keywords: chenile  trajectories tutorial
tags: chenile trajectories tutorial
sidebar: tutorial_sidebar
toc: true
permalink: /chenile-trajectories-tutorial.html
folder: chenile
summary: Chenile - Trajectories in action
---
## The Interface
We will use chenile-samples to demonstrate the power of trajectories. [Download chenile-samples from github](https://github.com/rajakolluru/chenile-samples). Then browse the s1 folder. In that folder you will find an API defined for S1Service under s1-api code module. It reads as follows:

{% highlight java %}
public interface S1Service {
	public S1Entity op1(S1Entity s1Entity);
}
{% endhighlight %}

## Implementation
It is a simple enough interface. Here is a simple implementation of the interface in s1-service code module. It reads as follows:

{% highlight java %}
public class S1ServiceImpl implements S1Service{
	@Override
	public S1Entity op1(S1Entity s1Entity) {
		// Implement the service here
		if (s1Entity.id != null && s1Entity.id.equals("foo")) {
			throw new ErrorNumException(500,1234,new Object[] {s1Entity.id});
		}
		s1Entity.id = "S1ServiceImpl";
		return s1Entity;
	}
}
{% endhighlight %}
As we see, the implementation throws an error if a special ID "foo" is passed. The error code is 1234. The error is defined in the message bundle that is attached to the s1-service code module. It is defined as follows:

{% highlight properties %}
E1234=ID with value {0} is not valid
{% endhighlight %}


Notice that when the exception is thrown the ID is passed as a parameter to the ErrorNumException constructor. The ID will be substituted for {0} above and we will have the error message "ID with value foo is not valid". 

## The Configuration class 
We need to instantiate the Impl class in a configuration class that is in a package of the form "com.mycompany.myorg.{servicename}.configuration". We will look at the code below for instantiation. 
{% highlight java %}
	@Bean public S1Service _s1Service_() {
		return new S1ServiceImpl();
	}
{% endhighlight %}

## The Controller
Finally, we create a controller class that helps us to register the s1Service into Chenile.
{% highlight java %}
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
{% endhighlight %}

This class does the following:
1. Registers the s1Service into chenile and attaches it to the service and health check beans.
2. Exposes the operation via HTTP Post. 

It is almost identical to a Spring Boot controller and uses the same annotations with the extra ChenileController annotation. Also, notice that it extends ControllerSupport and calls the process method with the args received so that the Chenile pipeline can be kicked off. 

## The Test Case
Let us quickly look at the test case. We test this functionality in the feature file in s1-service code module.
{% highlight cucumber %}
Feature: Tests the s1 Service using a REST client. 
  Scenario: Trial test. Change it according to the actual service

    When I POST a REST request to URL "/s1/op1" with payload
    """
    {
	 
	}
	"""
	Then the REST response key "id" is "S1ServiceImpl"
  Scenario: Set id to foo. See if it throws an exception

    When I POST a REST request to URL "/s1/op1" with payload
    """
    {
	 "id": "foo"
	}
	"""
    Then the error array size is 1
    And the top level code is 500
    And the top level subErrorCode is 1234
    And the top level description is "ID with value foo is not valid"
	 
{% endhighlight %}

The entire logic looks obvious. We have a self-contained implementation of s1 with an accompanying feature file that tests this functionality and a message bundle as well. 

## Overriding the functionality for a trajectory t1
Now, let us say we want to override this functionality for a trajectory t1. We want to return ID as "S1T1ServiceImpl" and throw a different exception 1235 if the foo ID is passed. We can of course make an IF condition in the code to do this. But that gets ugly real quick! 

The problem with this approach is that as we start adding more trajectories, the code gets very ugly. Secondly, it would be a nightmare to get rid of the t1 specific code once it is no longer required. Remember, trajectories are ephemeral and are not required forever in the code. 

So the best way is to create a new code module for the trajectory t1 for service s1. We call this code module s1-t1-service. s1-t1-service can depend on s1-service. We extend S1ServiceImpl to create a new class called S1T1ServiceImpl which implements the same S1Service interface. Let us look at our code here:

{% highlight java %}
public class S1T1ServiceImpl extends S1ServiceImpl{
	@Override
	public S1Entity op1(S1Entity s1Entity) {
		// Implement the service here
		if (s1Entity.id != null && s1Entity.id.equals("foo")) {
			throw new ErrorNumException(500,1235,new Object[] {s1Entity.id});
		}
		s1Entity.id = "S1T1ServiceImpl";
		return s1Entity;
	}
}
{% endhighlight %}
Note that there is no value gained above by extending the class. We could have just implemented the S1Service directly and write the whole code from scratch. Anyways, we are now throwing a new error 1235 which is applicable only on t1 trajectory. We will define a resource bundle for trajectory t1 in this code module as follows:
{% highlight properties %}
E1235=ID with value {0} is illegal
{% endhighlight %}

## Overriding the health check
As you might have noticed, we are extending the health check as well. But we are going to skip that for this article as it becomes obvious once you understand the main service class.

## Instantiating the Trajectory Bean
We instantiate the trajectory bean in pretty much the same way as we instantiate the main bean. Let us look at our configuration class.
{% highlight java %}
	@Bean
	@ConditionalOnTrajectory(id = "t1", service = "s1Service") public S1Service s1T1Service() {
		return new S1T1ServiceImpl();
	}
{% endhighlight %}

The chief difference here is that we add an annotation that specifies that for trajectory t1 for service "s1Service" we want to use this bean s1T1Service rather than the default bean s1Service. 

There is no need to add a controller since we want to serve the request from the same URL. Also, we are not defining a new service. We are reusing the same service s1Service but have stated that the service bean is different for trajectory t1. 
Now we are all set! Let us test our trajectory using a test case.

{% highlight cucumber %}
Feature: Tests the s1 Service using a REST client. 
  Feature: Tests the s1 Service using a REST client. 
  Scenario: Check if the overridden service is called
    When I construct a REST request with header "x-chenile-trajectory-id" and value "t1"
    And I POST a REST request to URL "/s1/op1" with payload
    """
    {

	}
	"""
	Then the REST response key "id" is "S1T1ServiceImpl"
  Scenario: Set id to foo. See if it throws an exception with the appropriate error code for t1
    When I construct a REST request with header "x-chenile-trajectory-id" and value "t1"
    And I POST a REST request to URL "/s1/op1" with payload
    """
    {
	 "id": "foo"
	}
	"""
    Then the error array size is 1
    And the top level code is 500
    And the top level subErrorCode is 1235
    And the top level description is "ID with value foo is illegal"
  Scenario: Set id to foo. See if it throws an exception with the appropriate error code for non t1
    When I construct a REST request with header "x-chenile-trajectory-id" and value "t2"
    And I POST a REST request to URL "/s1/op1" with payload
    """
    {
	 "id": "foo"
	}
	"""
    Then the error array size is 1
    And the top level code is 500
    And the top level subErrorCode is 1234
    And the top level description is "ID with value foo is not valid"
{% endhighlight %}

This test case asserts that when a trajectory header is detected, the service is switched by Chenile. This keeps the trajectory code completely modular. 

