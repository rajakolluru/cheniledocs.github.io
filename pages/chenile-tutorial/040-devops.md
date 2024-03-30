---
title: Chenile DevOps
keywords: Chenile devops
sidebar: tutorial_sidebar
toc: true
permalink: chenile-devops.html
folder: chenile-tutorial
summary: How does Chenile help with DevOps?
---
# Building the Service & Mini Monolith

## Build & Versioning 
We will discuss the build strategy for Chenile projects. This is combined closely with the versioning since the version specified in the pom.xml is "${revision}". revision is one of the specified three variables that are called CI Friendly in Maven. Please see [this page for details](https://maven.apache.org/maven-ci-friendly.html)

The pom file has also been integrated with the maven-flatten-plugin to facilitate automatic replacement of ${revision} in the pom file by an appropriate value.

The proper way to invoke Maven is to use:
```bash
mvn -Drevision=xxx goal
```
The pom.xml remains independent of different versions. This makes merging a cinch since we dont have to deal with different pom.xml. Usually, since the version is typically contained in pom.xml, automatic merges dont work well. 

Usually a new version coincides with a tag. So it is recommended that a new tag be created whenever a new version of the software needs to be launched. We can use the "git describe" command to get the latest tag that is in the current branch. If we combine these two techniques, ideally the build needs to be invoked as follows:
```bash
mvn -Drevision=$(git describe) goal

```
The "git describe" command gives the latest tag and adds the latest commit ID to it. For example if there is a tag 1.0.0-SNAPSHOT that got created and then a new commit (dd4c78c) was made to the software, then the git describe command gives "1.0.0-SNAPSHOT-1-gdd4c78c". This reflects the fact that one commit was made subsequent to taking the 1.0.0-SNAPSHOT and that the latest commit ID was "dd4c78c". This can lead to proliferation of unnecessary ephemeral versions.  In order to avoid proliferating these versions, it is recommended that we use a slightly different invocation: 
```bash
mvn -Drevision=$(git describe --tag --abbrev=0) goal
```

There are multiple small scripts of this kind which have been put together into a unified Makefile. This Makefile contains multiple commands. To enumerate all the commands, type "make" without any arguments. 

To build the latest tag, use 
"make build". This invokes the mvn command above. 
"make tag tag=1.1.0-SNAPSHOT" generates a new tag and puts it into git.

Other commands are available in Make. There are scripts available to accomplish simple things in the scripts folder.

## Building the Service 
Goto the s1 folder. Execute:
```bash
make build
```
This executes the mvn install for both s1-api and s1-service. It executes the tests as well. 

## Building the mini monolith
Goto the m1 folder. Execute:
```bash
make build
```
This executes the mvn install for both m1-configurations and m1-package. The m1-package also executes integration test cases if configured. As part of this, it will generate m1-package/target/openapi.json that has the Open API spec for all the deployed services. It also generates a folder called "service-registry" in target that contains custom JSONs for all services. 

These can be deployed into a service registry by writing suitable scripts. 

## Running the mini monolith
Goto the m1 folder. Execute:
```bash
make run
```
This runs the main application that resides in m1-package. 
Execute:
```bash
make test-script
```
to test the deployment. It executes a curl-script that verifies if the services are deployed and working correctly.


