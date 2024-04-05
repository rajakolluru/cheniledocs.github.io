---
title: Chenile Development Model
keywords: chenile  servicemesh
sidebar: chenile_sidebar
toc: true
permalink: /chenile-development.html
folder: chenile
summary: Chenile - Development Model
---
# Library Stack

* Chenile is an open source framework with no connections to Walmart specific systems
* Individual applications are built on top of Chenile.  Applications consist of services and mini monoliths

# Chenile Bill Of Materials

## Dependency Version
* Dependency management of all versions
* Including spring boot dependencies + Chenile dependencies

## Library Distribution
* Proximity for library distribution

## CI Friendly 
* CI friendly maven variables such as "revision"
* "revision" is obtained from git tag (using git describe)

![Library Stack](/images/chenile/library.png "Library Stack")