---
title: JGen - The Java based Code Generator
keywords: jgen.sh code generation Blueprints java-based
sidebar: tutorial_sidebar
toc: false
permalink: jgen-tutorial.html
folder: chenile-tutorial
summary: An introduction to JGen -  the code generator based out of Chenile
---

## What is JGen
[JGen](https://github.com/rajakolluru/chenile-gen/tree/main/jgen) is a general purpose code generator written in Java. JGen can be used to generate all kinds of code.
Specifically, it is used to generate [Chenile](http://chenile.org) code.

jgen is a set of code generation utilities. They use the concept of blueprints. Blue prints contain a
template for code along with code naming conventions etc.
jgen can be used as a framework to generate a Chenile module. jgen can also be used to do code
generation outside of Chenile.

## How to get JGen
Simply goto the [chenile-gen Github repository](https://github.com/rajakolluru/chenile-gen). Git clone the repo. 
Then navigate to the jgen folder under the repo folder. Jgen can be constructed from sources using "make clean all"
Ensure that <path-to-chenile-gen>/jgen/jgen-cli/bin is in the PATH so that you can use jgen.sh in the command line