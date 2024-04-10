---
title: Chenile Error Handling
keywords: chenile  error-handling
sidebar: chenile_sidebar
toc: true
permalink: /chenile-error-handling.html
folder: chenile
summary: Chenile - Error Handling
---
Chenile has a comprehensive approach to error handling. 

Important features of the Chenile error handling framework:

* **Simplicity** - Makes it very simple and natural for services to throw errors
* **Standardization** - Base exception classes. Standard way to throw errors. 
* **Error Registry** - a registry which contains mappings between specific back end errors and the errors that need to be thrown to the end users
* **i18n** - Errors are in multiple languages 
* **Support for Warnings** The response can implement the WarningAware interface to state that it stores warnings. Additionally, maps are also supported for storing warnings and errors.


## Error Generation & Treatment
When services determine that they need to return errors, they throw exceptions. There are recommendations about throwing exceptions:

* Ensure that RuntimeExceptions are thrown - more specifically throw exceptions that are sub classed from ErrorNumException. This exception captures an error and sub-error. The error code is a HTTP response status code. In fact the error code is returned as the HTTP response code if the request is made via HTTP. The sub-error is important. It denotes the correct sub type of exception. Proper sub errors allow the clients to deal with error conditions in a predictable fashion.
* ErrorNumException has sub classes like ServerException (HTTP status code 500), NotFoundException (HTTP status code 404), BadRequestException(HTTP status code 400). These can be thrown for convenience. Any exception which is not a RuntimeException will be surrounded by a ServerException with sub error num as 3 (Service error) 
* Internationalization support - All errors would be internationalized by the Chenile exception handler. The ErrorNumException contains provisions to internationalize the messages. (discussed below)
* Field, description, code and subErrorCode are other values stored in ErrorNumException. Use them as needed to make the error very specific
* ErrorNumException also stores params that can be substituted in internationalized messages by markers such as \{0\} , \{1\} etc.


## How are errors shown to the end user who consumes an HTTP end point?
From a HTTP client perspective, all Chenile services return a generic response that looks like the following :

{% highlight java %}
    int Code // Same as the HTTP status code that was returned. 
    int SubErrorNumber // if the service threw an ErrorNumException this is sub error in the ErrorNumException. Else it will be 3 (Service Exception)
    String Message // the internationalized message 
    Object payload // this contains the actual response from the service
    String severity // ERROR | WARN
    ResponseMessage errors [] // All the errors or warning that got created for this request. Each of them have the same fields above like code, subErrorCode, description, Severity, field and params
{% endhighlight %}
   

The HTTP status code will be the code that was returned in the body.

## How do warnings get treated?
Warnings are treated like valid responses in Chenile. The services that return warnings must return a response object that implements WarningsAware interface. Alternately if a map is returned, the warnings will have to be in a specific key in the map. An array of "ResponseMessage"s are returned. These messages are internationalized and logged by the Chenile error handling interceptor.

Additionally from a HTTP perspective the warnings are treated in these special ways:

HTTP Status code will be in the success (2XX) range. 
A warnings response header is returned with the content of warnings. Each message in the warnings array will generate one warning response message header (the HTTP protocol allows for several response headers with the same name so this is not a problem). Warnings will get internationalized like errors.

# Internationalized Error & Warning Messages
Errors and warnings must provide the following information to facilitate internationalization.

{% highlight java %}
String description // this should not be populated by the service. it will instead be looked up from the message bundle and populated by the Chenile Exception handler. 

int SubErrorCode // this code is looked up from the i18n bundle. All Sub Error Codes are numeric. The message bundle code is prefixed with 'E'. Hence subErrorCode 901 can be looked up using E901

Object[] params //. these are substituted in the message bundle. We can use parameter substitution features of the message bundle. (such as {0}, {1} etc. )
{% endhighlight %}



