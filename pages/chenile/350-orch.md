---
title: Chenile Orchestration
keywords: chenile  orchestration
sidebar: chenile_sidebar
toc: true
permalink: orch.html
folder: chenile
summary: Chenile - Orchestration
---

# Chenile Orchestration
The Chenile orchestration framework (aka OWIZ - Orchestration  Wizard) is a command and chain of responsibility framework. It breaks the functionality into commands which are in essence - slices of functionality. The individual commands get stitched into a micro orchestration that can be configured separately. XML configuration can be used to power this. 

Each command is a modular unit of functionality e.g., aurora interceptors, SDKs for different Resource Tiers (RTs). Owiz can attach commands to chains depending on configuration. These chains can form complex command graphs that can implement complex functionality. 

Owiz supports the following types of chains:
* **Simple chain:** where a list of commands are executed one after the other.
* **Parallel chain:**  Where commands are executed in parallel to implement a scatter-gather pattern
* **Interception Chains:** where a command intercepts another command and provides decorator functionality
* **Routers:** where one of several commands is executed depending on the request “route”. This can be used to implement customized logic that can differ by region, A-B test etc.  

By combining these chains, it is possible to create extremely complex orchestrations. 


## Support for a DSL 
Chenile orchestration supports the creation of a domain specific language (DSL). The Spring names for the created beans allow for a flexible tagging support. New tags can be created and registered into OWIZ. The spring bean names can also be used as Owiz tags.

For a tutorial on owiz [please see this link](../chenile-tutorial/owiz-tut)