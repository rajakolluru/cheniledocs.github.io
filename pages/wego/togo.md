---
title: "ToGO - devops to go"
keywords: WeGO devops togo
sidebar: wego_sidebar
toc: true
permalink: togo.html
folder: wego
summary: DevOps on the way for Go programs in general and WeGO services in particular
---

## Introduction
**ToGO** contains a set of scripts and a template Makefile.

<a name="Makefile"/>

## Makefile
The togo Makefile allows anyone to construct GO programs in WeGO with great ease. The Makefile can be copied and used as is. Makefile can be customized by editing _.env_ file. The .env file contains values for some important environment variables.

## .env file
{% highlight Makefile %}
BASEDIR=$(shell pwd)
## The version of the program that is going to be released. Derive this from git
export VERSION=$(shell git describe --always )
# The config path consists of all the configuration files. By default it is assumed to be
# a sibling of the project folder but can be customized by changing this value
export CONFIGPATH=$(BASEDIR)/../configs
# The name of the application
export WEGO.APPLICATION_NAME=wego
# Enable / Disable writing into New Relic
export WEGO.NEW_RELIC_ENABLED=false
# Specify the port at which the server starts
export WEGO__PORT=5000
# Specify the place where TOGO exists. It is assumed to be a sibling of the project folder
export TOGODIR=$(BASEDIR)/../togo
{% endhighlight %}
The comments above make the .env file variables self evident.

## scripts folder
The scripts folder contains scripts that help the application build. Its structure is shown below:
```
├── LICENSE
├── Makefile
├── README.md
├── make.autocomplete
└── scripts
    ├── docker-deploy
    │   ├── Dockerfile
    │   └── docker-build.sh
    ├── prepare-dependencies
    │   ├── copy-configs.sh
    │   ├── copy-tests.sh
    │   ├── gen-error.sh
    │   ├── generate-dependencies-go.sh
    │   └── generate-main-test-go.sh
    ├── release
    │   ├── increment-tag.sh
    │   ├── make-hotfix-branch.sh
    │   └── merge-hotfix-to-master.sh
    ├── swagger
    │   ├── swagger-generate.sh
    │   └── templates
    │       ├── header.gohtml
    │       └── op.gohtml
    └── test
        └── test.sh
```
## Explaining the files
The Makefile.sample is useful to create makefiles. A subset of commands can be picked up from this file for typical GO projects. (it is useful beyond WeGO projects)


