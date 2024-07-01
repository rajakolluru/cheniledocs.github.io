---
title: Chenile Code Generator
keywords: app-gen code generation
sidebar: tutorial_sidebar
toc: false
permalink: app-gen-landing-page.html
folder: chenile-tutorial
summary: An introduction to app-gen -  the code generator for Chenile
---
## What is app-gen
[app-gen](https://github.com/rajakolluru/chenile-gen) is a framework that is used to generate a Chenile module. Chenile recommends multiple types of modules:
1. Service Modules - both API and service which are used to expose a service via HTTP
2. Workflow modules - which support a workflow oriented service via HTTP
3. Deploy modules (Or Mini Monoliths)- that support  a deployment. The service modules contain code for  one service whilst the deploy modules package multiple service modules and generate a Spring Boot deployment that can be executed. 

app-gen generates these modules automatically with hooks to Chenile and compliant to Chenile best practices. 

## Why app-gen
It is highly recommended that developers must use app-gen to generate Chenile modules due to the following reasons:
1. Chenile makes extensive recommendations around the structure of modules. app-gen automatically generates the modules in compliance to those recommendations.
2. app-gen evolves as the recommendations evolve. Hence by using app-gen, you are guaranteed to remain up to date in your adherence to Chenile recommendations.
3. By generating Makefile, BDD, etc. app-gen ensures that you leverage Chenile  features fully.
4. Boiler plate code is automatically minimized.

## How to use app-gen?
app-gen provides a wrapper program _gen.sh_ that can be used to generate the boiler plate code. 
It has straight forward options to choose between the different types of modules, provide an interface file or workflow file and then choose the URLS. We  will discuss these in more detail in the respective module  sections.