---
title: Writing a Chenile Interceptor
keywords: Chenile interceptor app-gen
sidebar: tutorial_sidebar
toc: true
permalink: chenile-writing-interceptor.html.html
folder: chenile-tutorial
summary: How do you write a chenile interceptor?
---
# Writing a Chenile Interceptor
A Chenile interceptor implements a service policy. A service policy is an implementation of a horizontal requirement that cuts across multiple services. 
## Guidelines
Here are some guidelines about writing a new interceptor:
1. **One & Only One:** The interceptor is responsible to only implement one policy. This is in keeping with the Single Responsibility Principle. In keeping with the DRY (Dont Repeat Yourself) principle, only one interceptor must be responsible to implement one policy.
2. **Configuration Driven:** The interceptor must be driven by specific configuration which is specified as part of deploying the service. The service registry entry has extensions built in. Each interceptor will specify its own schema for different extension "keys". This will be discussed below.
3. **Orchestration Unaware:** The service interceptor can assume that it will be part of the "interception stack" that will be called before the service is called. However, it should not assume any specific order for interceptors. It can still declare whether it must be called "before" or "after" the payload interception. This will guide the architects who are responsible to set up the interception stack.

## Writing a Chenile Interceptor

<TODO>
</TODO>