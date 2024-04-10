---
title: Local Service Registry
keywords: chenile  servicemesh
sidebar: chenile_sidebar
toc: true
permalink: /local-service-registry.html
folder: chenile
summary: Chenile - Local Service Registry
---
Local Service Registry contains the configurations for all the services and operations that are present in the mini monolith. 
_Chenile_ stores local service registry in a local data structure called _ChenileConfiguration_. The local service registry allows us to de-couple service implementations from their configuration. The configuration provides the following information:
1. Service Meta data: E.g., service name, operations that are supported by the service, the parameters that are accepted by the operation etc.
2. Service Policies: This defines the policies that are applicable for the service/operation. Policies can also differ depending on the context of the invocation. E.g., it is possible to define an interceptor chain for a service/operation based on region, A-B testing trajectory etc. 
3. Service Policies' Configuration: Chenile Service policy configuration is extensible. It allows new policies to be defined in a flexible fashion without making changes to the chenile core code that maintains the service registry.

## Specifying Service Configuration
Typically, there is a one to one mapping between services and their configuration. For example, a UserServiceImpl can map to a UserService configuration. However, in multi tenant systems, one configuration can map to multiple implementations. Hence Chenile provides a mechanism to capture service configuration distinct from the actual implementation. It is also possible that the same impl can map to multiple services. For example, the Chenile workflow service module uses a service called StateEntityWorkflowImpl that can be used by all workflow entities. This is because the service can behave differently in accordance to the state transition diagram that is fed to it. 

## Service Configuration Attributes 
We can define a service with multiple operations. Services are assumed to be instantiated in Spring as specified in [this article](/chenile-service-design.html). These configuration specify the name of the Spring Bean that needs to be called when the service is invoked. Some of the attributes are defined below:

|Attribute|Specified where?|Description|
|----------|-----------|---------------|
|name|Service|Specifies the spring bean name for the service|
|healthCheckerName|Service|The name of the health checker for the service|
|mockName|Service|The name of the mock bean in Spring. The mock bean is invoked when the service is invoked in _mock mode_. (Mock services are invoked when the exchange.isMock() is set to true)|
|name|Operation|specifies the name of the operation. Same as the Java method name|
|url|Operation|specifies the URL that maps to this service & operation. This can contain path variables. (e.g., /order/{id})|
|httpMethod|Operation|The HTTP method that is supported by the operation|
|produces|Operation|specifies the format of the output (JSON in this case)|
|output|Operation|specifies the Java type that is returned by the operation|
|input|Operation|specifies the Java type that is accepted as payload by the operation|
|interceptorComponentNames|Service & Operation|the specific interceptors that are applicable for all the operations if it is defined at the service level or for that particular operation if defined at the operation level|
|params|Operation|a list of parameters that are accepted by the operation. Each param has a name and a type that specifies if the param is extracted from a HEADER or PAYLOAD of the request.|

## Specifying Service configuration
Chenile currently provides two ways to specify configuration.

### JSON based
The following is an excerpt from chenile-http test case:
```json
{
  "name": "jsonService",
  "id": "jsonService",
  "operations":
  [
   {
    "name": "getOne",
    "auditable": "false",
    "url": "/system/property/{key}",
    "httpMethod": "GET",
    "produces": "JSON",
    "consumes": "JSON",
    "input": "",
    "output": "",
    "interceptorComponentNames":["jsonInterceptor"],
    "params":
    [
      {
        "name": "key",
        "type": "HEADER",
        "description": "System property key."
      }
    ]
  },
```

### Controller based
_Chenile_ additionally supports Spring rest controllers to configure the services. Spring controllers use annotations to specify the mapping of a URL to an operation within a service. The standard Spring annotations are supported along with Chenile specific annotations. Here is an example from chenile-http test case:
```java
@RestController
@ChenileController(value = "JsonController", serviceName = "jsonService" ,
    healthCheckerName = "JsonHealthChecker")
public class JsonController extends ControllerSupport{
     @GetMapping("/c/getOne/{key}")
     @InterceptedBy("jsonInterceptor")
     public ResponseEntity<GenericResponse<JsonData>> getOne(
             HttpServletRequest request, @PathVariable String key){
        return process("getOne",request,key);
    }

```
In this example, the annotation @ChenileController specifies that this controller is a Chenile Service configuration for service "JsonController". All controllers can extend a super class ControllerSupport and delegate to the process method to enable interception. The rest of the configuration is auto-populated using reflection and by accessing the Spring annotations. Note also that the above configuration adds an operation specific interceptor called "jsonInterceptor" for the getOne() operation of the JsonController service. 



