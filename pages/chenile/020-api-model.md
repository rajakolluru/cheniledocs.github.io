---
title: Chenile API Model
keywords: chenile  servicemesh
sidebar: chenile_sidebar
toc: true
permalink: chenile-api-model.html
folder: chenile
summary: Chenile - API Model
---
# Chenile API Model
The Chenile API model defines the messaging constructs within Chenile. Chenile services have flexible signatures that accept a myriad of input parameters and return values. Chenile does not impose any restrictions on a service signature. 

Chenile has unified the API signatures for good responses, errors and warnings. Hence the return value for a Chenile service in HTTP and other RPC based protocols has been standardized to a *GenericResponse* structure that is discussed below

# GenericResponse
The return value that is exposed by the HTTP transport is defined by a class called **GenericResponse**. The _GenericResponse_ class is a wrapper over the response that is returned by the service. It is capable of returning the errors and warnings in addition to the response from the service. Selected fields are discussed below with commentary above them.

```java
 	public class GenericResponse{
 		// denotes if the request is a success or failure
 		private boolean success = false;
		private List<ResponseMessage> errors;
		private Object data;
		// renders as JSON string
		private HTTPStatus code;
		// Below fields are from ResponseMessage and will be the same as errors[0] above
		// renders as JSON string
		private int subErrorCode;
		private String field;
		private String description;
		private ErrorType severity;
		private Object[] params;
		...
 	}
```

## GenericResponse Fields

| Field  | Values | Comments |
|--------|--------|----------|
| success|true or false | Returns true if the request is successful (with or without warnings) false if there are errors. If success is false then data will be null and must be ignored |
| errors | a list of ResponseMessage(s) (discussed below) | this gives a list of ResponseMessage objects with each one of them either representing an error or warning |
| data| return value from service or null if success is false| This field represents the return value from the service that is called. It can be ignored if success is false |
| code | HTTPStatus code| Same as the HTTP status code that is returned by the API. In short, the payload of the response echoes the actual HTTP status code that was returned|

## ResponseMessage fields in GenericResponse
All the responseMessage fields are a replica of errors[0]. So for example, if there are 2 ResponseMessage object returned in the _errors_ array, then the subErrorCode, description, field etc. at the GenericResponse level will be the same as the subErrorCode, description, field etc. from the first element in the errors array. 

# ResponseMessage 
The **ResponseMessage** is a structure that contains more information about errors and warnings. Selected fields are discussed below:

```java
	public class ResponseMessage {
		// renders as JSON string
		private HTTPStatus code;
		// renders as JSON string
		private int subErrorCode;
		private String field;
		private String description;
		private ErrorType severity;
		private Object[] params;
	}
```

## ResponseMessage fields

| Field  | Values | Comments |
|--------|--------|----------|
| code| HTTP status code| The HTTP status code that corresponds to this error or warning. Typically in the 4XX and 5XX series |
| subErrorCode| An integer | An integer that denotes the correct API error. The ranges are defined by the service |
| field| String | Field where the error occurred. This gives more information as to where the error previsely occurred. |
| description|string|An internationalized description of the error that actually happened |
| severity|WARN or ERROR| This indicates if this is an error or warning message |
| params|array of strings typically|This array of strings is used to populate placeholders in the description. Typically, not required from an end user perspective but it can be useful for test automation and validation |


