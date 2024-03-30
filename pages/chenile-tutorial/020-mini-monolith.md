---
title: Chenile Mini Monolith
keywords: Chenile minimonolith
sidebar: tutorial_sidebar
toc: true
permalink: chenile-generating-minimonolith.html
folder: chenile-tutorial
summary: How does Chenile implement the Mini Monolith architecture?
---
# The Mini Monolith Structure
The mini monolith consists of two modules with a parent pom. The parent pom as usual inherits from chenile-parent. There are two modules:

* m1-configurations - Contains all configuration files. This gives the deployer the opportunity to have one central chenile.properties configured which can be distributed to every mini monolith. This keeps the configuration central which can be pushed.
* m1-package - Contains the main Spring Boot class. It does not have any other code. It has other configuration files that are local to the mini monolith. The most important one is the version.txt which will be discussed later in [Dev Ops module](devops).

# Central Configurations
The configurations, as we mentioned before, can be stored in one place within an org. Then it can be used in all mini monoliths that belong to the org to enforce consistency in the way the interception framework is being used. 

# The Package module
The m1-package module does the following:
1. It includes all the constituent services in the pom file. 
2. It supplies the main() method. It will also provide the scanBasePackages attribute for Spring appropriately so that all service configurations, chenile  configurations are read by Spring. 
3. It includes the spring-doc plugin to automatically generate the OPEN API JSON for all the services that are deployed here.
4. It includes the chenile-maven-plugin to automatically generate the custom JSON spec for all services that are deployed here. 




