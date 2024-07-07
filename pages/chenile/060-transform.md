---
title: Chenile Transformation Framework
keywords: chenile  transformation
sidebar: chenile_sidebar
toc: true
permalink: /chenile-transformation.html
folder: chenile
summary: Chenile - Transforamtion Framework
---
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

## Transformation Steps
The Chenile transformation framework converts the JSON payload in two steps:
1. Where it identifies the class to which the JSON needs to be converted. This process is called body type selection. For the class above for the save() method, the body type is the _User_ class. 
2. The actual process of transformation where the JSON is converted to the target body class.

## Skipping the transformation
The transformation framework currently converts Strings to POJOs. So if the body of the exchange already contains a non String type, the transformation process is skipped. This is because the Spring controller might have performed this task already. Or perhaps the caller could have already called with the correct format of the body. This makes the transformation process redundant and hence it is skipped.

## How does the framework determine the type of RequestBody?
The Chenile transformation framework uses the following algorithm to determine the **body class** of the object to be transformed. 

[![Transformation Algorithm](/images/chenile/transformation-algorithm.png)](/images/chenile/transformation-algorithm.png)

The same service class can be exposed using various chenile services. Here are some scenarios:

### Scenario 1: 
> A service class **UserServiceImpl** is exposed using one or more chenile services such as  "user-service", premium-user-service etc. each service corresponds to a unique URL such as /user, /premium-user.

This is a trivial case. The type of class that is accepted by the controller determines the request body.Spring does the job for us for HTTP. The Chenile transformation framework will not do anything since the transformation has happened already. However, in non HTTP cases, it will convert the JSON to the correct body as accepted in the controller. 

### Scenario 2: 
> A Service class **UserServicImpl** is exposed exactly once using a Chenile Service called "user-service". However, the class can accept multiple subtypes using highly customized logic. 

In this case, the controller cannot make a decision and hence will accept a string as the request body i.e. the JSON comes unparsed from the controller to the transformation framework.
We need to register a body type selector that uses customized logic to determine the correct subtype. The body type selector has access to the entire ChenileExchange and hence can access request headers, payload etc. to make that determination. (see the section on body type selector below)

### Scenario 3: 
> A Service class **UserServicImpl** is exposed exactly once using a Chenile Service called "user-service" using a unique URL /user. However it is possible to pass subclasses of the User to the UserServiceImpl. Example: "PremiumUser", "SuperUser" etc. 

This is a special case of Scenario 2 above.  The JSON is partially parsed. A type attribute is identified at the top level in the JSON. The type determines the subclass that needs to be used. The subclass must be registered in the subclass registry. To avail this, please use SubclassBodyTypeSelector and the Subclass registry(see below)

## Uses of Body Type Selector
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
		public ResponseEntity<GenericResponse<User>> save(HttpServletRequest request,
			@ParamClass("body") @RequestBody String user){}
	}
```  

This allows the framework to instantiate the specific sub class for a super user. This feature is very useful. It can be used in trajectory processing. See [chenile trajectories](/chenile-trajectories.html).

## Subclass Registry & SubclassBodyTypeSelector
We will discuss the test case in chenile-http that illustrates this usecase perfectly. Consider the following classes:

```java
public class Vehicle  {
    public String type;
    public String id; // vehicle identification number

    /**
     * does nothing. sub classes compute the correct capacity.
     */
    public Capacity addCapacity(Capacity capacity){
        return capacity;
    }
}

public class Truck extends Vehicle{
    // for type  = 'truck'
    public int carryingCapacityInKgs;
    @Override
    public Capacity addCapacity(Capacity capacity) {
        capacity.weightCarryingCapacityInKgs += carryingCapacityInKgs;
        return capacity;
    }
}

public class Car extends Vehicle{
    // for type  = 'car'
    public int numPassengers;
    ...
    @Override
    public Capacity addCapacity(Capacity capacity) {
        capacity.numPassengers += numPassengers;
        return capacity;
    }
}

public class Capacity {
    public int numPassengers = 0;
    public int weightCarryingCapacityInKgs = 0;
}

public class CapacityService {
    public Capacity addCapacity(Vehicle vehicle){
        Capacity capacity = new Capacity();
        vehicle.addCapacity(capacity);
        return capacity;
    }
}

```

The objective is to expose CapacityService as a micro service. The input JSON must be either converted to a Truck or Car class depending on the type that is passed. We will define a controller that will make this happen. 
```java
@RestController
@ChenileController(value = "capacityService", serviceName = "capacityService")
public class CapacityController extends ControllerSupport {
    @PostMapping("/add-capacity")
    @BodyTypeSelector("subclassBodyTypeSelector")
    public ResponseEntity<GenericResponse<Capacity>> addCapacity(
            HttpServletRequest request, @ChenileParamType (Vehicle.class) @RequestBody String vehicle) {
        return process(request,vehicle);
    }
}

@Configuration
public class TestChenileHttp extends SpringBootServletInitializer{
	...
	@Bean public CapacityService capacityService() {
		return new CapacityService();
	}

	@PostConstruct public void postConstruct(){
		subclassRegistry.addSubclass(Vehicle.class,"car", Car.class);
		subclassRegistry.addSubclass(Vehicle.class,"truck", Truck.class);
	}
}
```
Notice the following:
1. The addCapacity is defined with RequestBody as String. We are asking Spring to not convert the JSON to an object since it will not have sufficient information to do so.
2. The ChenileParamType tells Chenile that though the Controller is expecting a String the actual service class (CapacityService) is expecting a Vehicle.
3. Body type selector ("subclassBodyTypeSelector") is registered to support the body type conversion.
4. The @Configuration class not only initializes the capacityService. It also registers the Car and Truck class in the subclass registry with a type "car" and "truck". This tells the Subclass registry to return the appropriate subclass type depending on the type found in the JSON.

With all these in place, we can see that the test case works as follows:

```java
@RunWith(SpringRunner.class)
@SpringBootTest(classes = TestChenileHttp.class)
@AutoConfigureMockMvc
@ActiveProfiles("unittest")
public class TestSubclassing {
    @Autowired
    private MockMvc mvc;
    @Test
    @DisplayName("Tests if the Car sub class is used.")
    public void testCar() throws Exception {
        Car car = new Car("123",5);
        mvc.perform( MockMvcRequestBuilders
            .post("/add-capacity")
            .content(TestUtil.asJsonString(car)) // converts car into json
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.APPLICATION_JSON))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.payload.numPassengers").value(5))
            .andExpect(jsonPath("$.payload.weightCarryingCapacityInKgs").value(0));

    }

    @Test
    @DisplayName("Tests if the Truck sub class is used.")
    public void testTruck() throws Exception {
        Truck truck = new Truck("123",5);
        mvc.perform( MockMvcRequestBuilders
                .post("/add-capacity")
                .content(TestUtil.asJsonString(truck))
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payload.numPassengers").value(0))
                .andExpect(jsonPath("$.payload.weightCarryingCapacityInKgs").value(5));

    }
}
```

The _subclassBodyTypeSelector_ "sniffs" at the JSON to determine its type. It uses the type to determine the appropriate subclass.

BodyType selectors are provided in Chenile for other situations such as workflow service etc. 

