---
title: Micro Service Generation Using app-gen
keywords: app-gen code generation 
sidebar: tutorial_sidebar
toc: true
permalink: chenile-microservices.html
folder: chenile-tutorial
summary: How to generate a typical micro service using app-gen
---

## Introduction
It is trivial to generate a micro service using gen.sh that is shipped within app-gen. However, you do need a shell environment such as __bash__ or __powershell__ . 

## Dependencies
You need the following in your machine to execute gen.sh
1. Node must be installed in your machine. gen.sh uses mustache (which it downloads automatically)
2. UNIX/LINUX _make_ is required to make the executable first time. 
3. mvn for the build

In this page, we will see how exactly this is done.

## Steps
### First download and set up app-gen
Comments are given below each instruction preceded by #
{% highlight bash %}
$ mkdir code; cd code # wherever you want to create these folders
$ # Hence forth all references will be with respect to this folder
$ git clone https://github.com/rajakolluru/chenile-gen.git
$ cd app-gen
$ make 
$ # this will compile all the programs to app-gen/bin. It also downloads mustache
$ export PATH=$PATH:<path-to-app-gen>/bin
$ # puts app gen in the path
{% endhighlight %}


Services in Chenile are plain POJO code. They implement a service interface. The service interface is visible to all the consumers of the service. The service code itself is not made accessible. This is in compliance with the DIP (Dependency Inversion Principle) which states that higher modules must not depend on lower modules. Instead, they must depend on the interface that is exposed by the lower modules. 

For example, for service _s1_ the interface is defined in a module called _s1-api_. The service implementation is defined in a module s1-service. If a serice _s2_ needs to consume _s1_, it needs to depend on _s1-api_ (and not _s1-service_)

Service modules are not designed to be deployed. They are packaged as libraries. 

### Prepare gen.sh 
__gen.sh__ must always be executed from the same folder (typically  $HOME). 
{% highlight bash %}
$ cd 
$ # this will take you to your home folder
$ gen.sh
$ # this gives you a bunch of options. Choose option to "create a local config".
{% endhighlight %}

The above creates a folder called __config__ under the $HOME folder. This folder contains a file _setenv.sh_ thst needs to be edited to make sure that the code generated uses the correct value for company and org. company is the name of your company and org is the org (or product) within the company. 
Now you are all set to generate the service.

### Generate the Service
{% highlight bash %}
$ cd 
$ # this will take you to your home folder
$ gen.sh
$ # this gives you a bunch of options. Choose option to "create a normal service and monolith".
$ # When prompted input "stringdemo" for the service name. You can go with the defaults for service version and output folder
$ # which is typically ./output. We will call it $code_dir in this document.
$ # When prompted for monolith name use "stringdemodeploy".
$ # gen.sh does the rest!
{% endhighlight %}

## What Got Generated?
gen.sh creates two  folders  - stringdemo and stringdemodeploy. Both these folders contain other folders that will be described below. 

## What do you do next?
{% highlight bash %}
$ cd $code_dir/stringdemo
$ make build
$ # makes the service 
$ cd $code_dir/stringdemodeploy
$ make build
$ # makes the deployable.
{% endhighlight %}

This executes __mvn__ to generate the entire structure. 






