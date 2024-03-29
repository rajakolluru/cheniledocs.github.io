---
title: WeGO Modules
keywords: WeGO core modules
sidebar: wego_sidebar
toc: true
permalink: wego_modules.html
folder: wego
summary: Approach to modularization.
---

## WeGO Modules 

WeGO prescribes GO Modules. WeGO encourages specific structures for modules and the way they are organized in a developer workstation as well in GIT.

Broadly, the following module types are recognized:

### Library Modules
These contain libraries which are envisaged to be packaged with services. Libraries contain utils and framework code. Library modules don't need to follow any particular convention except general considerations that apply to all modules. We will discuss these in the ensuing section.

### Service Modules
Services form the core of WeGO. Services contain code that does something useful and should be exposed via a transport such as HTTP. WeGO shines here and provides a framework that exposes services via various transports. It also provides a proxy to access the service on the client side.

WeGO prescribes all services to follow a modular structure consisting of two modules per service. One module contains the API and the other one contains the actual service. 

The API module contains the interface and other model objects. API should provide a HTTP proxy to invoke the service via HTTP. API modules are used by clients to assess the services via HTTP. The service modules will use the WeGO HTTP module to expose the services.

Service modules are independently deployable. They can generate an executable and can have a main() method. However, WeGO recommends that services be detached from deployment i.e. a service need not be deployed separately. Instead, several services can be combined into one deployment module.

### Deployment Modules

These modules de-couple the deployment from the services. Several service modules can be combined into one deployment. Deployable modules don't contain much code other than a main() method which calls all the other methods.

## Module Structure
All modules have a prescribed structure that is briefly discussed before. 

### Internal folder
GO recognises "internal" as purely internal to the current module. Hence WeGO prescribes that most of the internal code be under the internal folder.

### Configs
configs folder consists of all non GO resources. Resources can include the following:
1. Module  specific configurations are stored in toml files under configs/env. There are specific folders under configs/env which map to various values of $env (such as dev,prod etc.). In addition to them all, there is a "def" folder that contains the default values for all properties across all environments.
2. Resource bundles that are stored in configs/bundles under locale specific folders such as en-US etc. These can be translated using the i18n module. All exceptions also  get translated here.
3. Additional resources such as various configuration files. For example, all workflows are stored under a folder called configs/workflows.

### Module Root 
The Module  root folder consists of specific files such as Makefile, _config.yml, .gitignore, README.md etc. 

Module root typically must contain minimal GO code. The GO code is chiefly restricted to a Module Initializer code which is discussed [here](wego-init.html)

### internal/err 
internal/err consists of specific error code that are emitted out of this module. Error codes are translated to error messages using internationalized bundles. Error codes are mapped to error messages using the same name. For example, an error FileNotFound in module module1 can be mapped to an error message called module1.FileNotFound using a resource bundle. For more information see [here](error-handling.html)

### internal/cmd
internal/cmd typically contains commands such as main() which are exposed to the outside world in the command line. 

### api, model, proxy and internal/service
* api contains all the interface contracts exposed by this module. 
* model contains all the model objects (and also DTOs) exposed by this module
* internal/service contains the implementation of the contracts defined in api
* proxy also implements the same contract defined in api but is on the client side
See [stringdemoapi](github.com/agorago/stringdemoapi) and [stringdemoservice](github.com/agorago/stringdemoservice) for more details.

### test
This contains test utilities and contains BDD tests typically. Other unit tests are in the same folder as the GO code that they are testing.

#### Conventions on test files and packages
* We will use the GO standard of ending with _test for test files
* We will also use the test package name as the same name but with a _test suffix. Example the foo package will have test code under foo_test. This is an idiomatic way for GOLANG black box testing. 

## Conventions around Code Organization in a Developer Workstation (or laptop)

WeGO code is best organized using a folder structure as follows:
```
$ mkdir src
$ cd src
$ git clone github.com/agorago/wego # ( get the actual git repo url)
$ git clone github.com/agorago/gen-wego # (get the actual git repo url)
$ mkdir configs # this serves as the config path for all resources. 
```
All included git projects will be under src. Reference to other WeGO projects
projects will be relative. For example, you will create a relative path to WeGO in your module by typing the following:
```
$ cd src/my-service
$ go mod edit --alter github.com/agorago/wego=../wego
```
This establishes the relative path to WeGO from your service and allows changing of the WeGO code without requiring __GO LANG__ to extract the latest code from github






