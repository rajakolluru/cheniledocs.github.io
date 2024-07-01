---
title: Chenile Testing
keywords: Chenile testing
sidebar: tutorial_sidebar
toc: true
permalink: chenile-testing-tutorial.html
folder: chenile-tutorial
summary: How does Chenile facilitate testing?
---

# Chenile Service Testing
Chenile ships with a Cucumber based Gherkin testing suite that can be easily used to write integration tests. The test harness is pretty much out of the box with Spring. In service s1, the following test related files exist:

* src/test/java -> org.chenile.samples.s1.SpringTestConfig.java - which includes any test specific configurations in Spring
* src/test/java -> org.chenile.samples.s1.bdd - CukesRestTest.java and CukesSteps.java - These just set up the test harness. CukesSteps can be used to write new steps for this service. Mostly the cucumber-utils package in Chenile already provides the requisite steps and hence this may not be required. 
* src/main/resources -> org.chenile.samples.s1 - TestService-chenile.properties, TestService.properties

# The Test Harness
Cucumber test cases are very easy to write in Spring. There are three classes primarily.
CukesRestTest.java looks like below:
```java
@RunWith(Cucumber.class)
@CucumberOptions(features = "src/test/resources/features",
		glue = {"classpath:org/chenile/samples/s1/bdd", "classpath:org/chenile/cucumber/rest"},
        plugin = {"pretty"}
        )
@ActiveProfiles("unittest")

public class CukesRestTest {

}
```
The above test executes the features that are present in src/test/resources/features folder. The glue code is either provided in the local package or in the org/chenile/cucumber/rest package that exists in cucumber-utils. Hence cucumber-utils has been included as a dependency in the service pom.

# Cukes Steps
Cucumber requires a steps class that points to a TestConfig. Since the TestConfig would be local to the service jar, the steps class must also be local. Cukes steps are called by the Gherkin code as and when it encounters certain patterns in the features file. Most of the Cukes steps are already present in the cucumber-utils package. Additionally, the Cukes Steps class can be used to write more steps if required. The cucumber-utils package uses the features provided by the Spring Mock MVC framework. This allows us to stand up the entire service in an ephemeral instance and then send requests from the outside. In this way, we not only test the service but also test the interceptors for the service. 

The Cukes Steps class is shown below:
```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT,classes = SpringTestConfig.class)
@AutoConfigureMockMvc
@ActiveProfiles("unittest")
public class CukesSteps {
	@Given("dummy") public void dummy(){}
}

```
The snippet above creates a dummy method. The important functionality here is to link with SpringTestConfig class that allows us to make other test beans if required. 

Finally, we have a SpringTestConfig class defined as follows:
```java
@Configuration
@PropertySource("classpath:org/chenile/samples/s1/TestService.properties")
@SpringBootApplication(scanBasePackages = { "org.chenile.configuration", "org.chenile.samples.s1.configuration" })
@ActiveProfiles("unittest")
public class SpringTestConfig extends SpringBootServletInitializer{	
}
```
This class can be used to set up Spring. Note the scanBasePackages. This inititalizes Chenile beans along with other beans from the service. 
The "unittest" profile is activated and all the beans in this class will be registered under that profile.
Chenile requires a file called chenile.properties in the class path. The default filename can be over-ridden by setting a property called chenile.properties. This property is set by the TestService.properties file

```properties
chenile.properties=org/chenile/samples/s1/TestService-chenile.properties
```

The TestService-chenile.properties is the file that is used to configure chenile. Finally, there is a version.txt file with the contents as:
```
version=unittest 
```
This will be discussed more in [the devops](/chenile-devops.html) option.

# The Cucumber Features file
The cucumber features file gives a typical test case. Look at the test case:
```cucumber
Feature: Tests the s1 Service using a REST client. 
 
  Scenario: Trial test. Change it according to the actual service

    When I POST a REST request to URL "/s1/op1" with payload
    """
    {
	 
	}
	"""
	Then the REST response key "id" is "S1ServiceImpl"
```

This test case is typical of the BDD tests that are supported by cucumber-utils. A brief summary of then assertions applicable can be found [here](/chenile-testing.html)

This is how, we get the service set up. Next let us discuss the mini monolith structure
