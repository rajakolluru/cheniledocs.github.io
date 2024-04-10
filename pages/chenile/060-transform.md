---
title: Chenile Transformation Framework
keywords: chenile  transformation
sidebar: chenile_sidebar
toc: true
permalink: /chenile-transformation.html
folder: chenile
summary: Chenile - Transforamtion Framework
---
# Chenile Transformation Framework
The Chenile transformation framework allows fine level customizations on the transformation of objects from multiple formats to a POJO. Services expect payloads as POJOs. Typically, payloads are passed over the wire as JSON (or a similar format). 

Frameworks such as Spring use the Jackson library to convert the JSON payload to POJOs. The Chenile transformation framework can augment or replace the Spring transformations. It is much more flexible. 

Let us illustrate the transformation using an example. Let us say we have a class called UserServiceImpl which has this signature

```java
public interface UserService{
	public User save(User user);
}

public class UserServiceImpl implements UserService{
	public User save(User user){}
}

```

# Transformation Steps
The Chenile transformation framework converts the JSON payload in two steps:
1. Where it identifies the class to which the JSON needs to be converted. This process is called body type selection. For the class above for the save() method, the body type is the _User_ class. 
2. The actual process of transformation where the JSON is converted to the target body class.

# Skipping the transformation
The transformation framework currently converts Strings to POJOs. So if the body of the exchange already contains a non String type, the transformation process is skipped. This is because the Spring controller might have performed this task already. Or perhaps the caller could have already called with the correct format of the body. This makes the transformation process redundant and hence it is skipped.

# Uses of Body Type Selector
Chenile allows the specification of the body type using a body type selector. This feature allows for complex transformations. For example, let us say that there exists SuperUserServiceImpl that also implements the UserService. However, SuperServiceImpl will only accept SuperUser as the type. (SuperUser is a subclass of User)

In this case, the body type changes depending on if the User is a normal user or a super user. For Super users, the body type is SuperUser. For others it is User. This can be accomplished by defining and injecting a body type selector for the class. Body Type selectors can be injected in the controller. 

```java

	// First write the body type selector class
	public class UserBodyTypeSelector implements Command<ChenileExchange>{
		public void execute(ChenileExchange exchange){
			if (/* some logic to determine if it is a super user */){
				exchange.setBodyType(new TypeReference<SuperUser>() {});
			}else {
				exchange.setBodyType(new TypeReference<User>() {});
			}
		}
	}
	
	// Instantiate the body type selector
	@Bean public UserBodyTypeSelector userBodyTypeSelector(){
		return new UserBodyTypeSelector();
	}

	public class UserController extends ControllerSupport{

		// inject the body type selector in the User Controller 
		@BodyTypeSelector("bodyTypeSelector")
		public ResponseEntity<GenericResponse<User>> save(HttpServletRequest request,User user){}
	}
```  

This allows the framework to instantiate the specific sub class for a super user. This feature is very useful. It can be used in trajectory processing. See [chenile trajectories](/chenile-trajectories.html).



