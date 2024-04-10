---
title: Chenile Testing
keywords: chenile  testing
sidebar: chenile_sidebar
toc: true
permalink: /chenile-testing.html
folder: chenile
summary: Chenile - Testing
---
Chenile framework builds on top of the Chenile platform convention that stipulates the API signatures of Chenile services. The Chenile testing framework is powered by Spring Boot Mock MVC framework, Cucumber, Gherkin. 

The testing framework does the following:
1. Provides a basic scaffolding to write tests. The scaffolding comes out of the box with Spring Boot and Cucumber. 
2. Provides a ready made integration with Spring Mock MVC that allows people to test services from the outside including things like serialization, deserialization, service policies etc.
3. Since Spring Mock MVC supports a scripting language, this framework provides a thin wrapper that allows people to write test cases using a standardized Gherkin syntax. 

## Gherkin Syntax
Chenile framework has developed its own Gherkin syntax. This supports scripting. Hence this can be used without the need to 

## Test Invocation
### POST / PUT 
For POST requests, the syntax is:
```cucumber
When I POST a REST request to URL "url-value" with payload
"""
{
  json here
}
"""
```
We will need to replace the POST keyword with PUT for the PUT HTTP verb. 
### GET
The syntax is:
```cucumber
When I GET a REST request to URL "url-value"
```
### Adding Headers to Request
If it is desired to add headers, it can be done by using the following construct:
```cucumber
When I construct a REST request with header "headerName" and value "headerValue"
```

This should precede the request invocation. Example:
```cucumber
When I construct a REST request with header "header-name" and value "header-value"
And I POST a REST request to URL "/{{service}}" with payload
"""
{
	"model":{}
}
"""
```
After invoking the tests, we must be able to assert on the results. The following statements enable this:
## Http Status Code Check
The syntax is:
```cucumber
Then the http status code is 202
```

## Payload Assertions
The generic payload from Chenile has a few standard attributes. The following assertions are provided for these attributes. 
```cucumber
Then success is true
## Asserts if the success flag is true
Then success is false
## Asserts if the success flag is set to false
Then the REST response is null
## Asserts if the payload attribute is null
Then the REST response contains key "abc"
## Asserts if payload.abc exists
Then the REST response does not contain key "abc"
## Asserts if payload.abc does not exist
Then the REST response key "abc" is "xyz"
## Asserts if payload.abc = "xyz"
Then the error array size is some-number
## Asserts if payload.errors.length() == some_number
Then the top level code is some-number
## Asserts if payload.code == some-number
Then the top level subErrorCode is some-number
## Asserts if payload.subErrorCode == some-number
Then the top level description is "some-description"
## Asserts if payload.description == "some-description"
```
## Assertions for Warnings & Errors

```cucumber
Then a REST warning must be thrown that says "warning-message" with code some-code and http status some-status
## Asserts that in the errors arrayn there exists at least one warning message with description as "warning-message" and subErrorCode == sub-code and  code == httpStatus 
Then a REST exception is thrown with status {int} and message code {int}
## Asserts the same thing for a warning
```

