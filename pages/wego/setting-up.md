---
title: Setting up WeGO
keywords: WeGO setup
sidebar: wego_sidebar
toc: true
permalink: wego_setup.html
folder: wego
summary: Brief instructions to set up the WeGO code base and execute some basic commands
---
## WeGO Setup
```
$ mkdir src
$ cd src
$ git clone https://github.com/agorago/wego.git
$ git clone https://github.com/agorago/stringdemoapi.git
$ git clone https://github.com/agorago/stringdemoservice.git
$ git clone https://github.com/agorago/sample-deploy.git
```

## Examining the different folders
### wego
This folder contains the library of WeGO. Framework code that provides the functionality of WeGO.

### stringdemoapi
This contains the contracts that are exposed by the stringdemo service. It also contains the proxy to allow a client to assess the service. This is distributed as a library as well.

### stringdemoservice
This contains the implementation of the stringdemo service. The service can be packaged and distributed using this service. This contains a main() method.

### sample-deploy
It only contains the main() function and packages the stringdemo service. For one service deployments, this folder does not add any value. However, this folder allows multiple services to be packaged into one consolidated deployment.

## What do you do next?
```
$ cd src
$ cd sample-deploy
$ make build
$ make run
# this will execute the main() method in the foreground and will block this window.
# Go to another window
$ cd src
$ make test-scripts
# The curl scripts must execute properly
# Go back to the previous screen
Press <Ctrl> C to end the process.
$ make test 
## this executes the BDD scripts
```

Play with WeGO 
```
$ cd src
$ cd wego
$ make test 
# executes all the tests
$ make coverage
# gives the coverage in a browser window
```

