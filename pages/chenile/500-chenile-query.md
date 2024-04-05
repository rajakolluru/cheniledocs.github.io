---
title: Chenile Query Service
keywords: chenile  query
sidebar: chenile_sidebar
toc: true
permalink: /query.html
folder: chenile
summary: Chenile - Query Service
---

# Chenile Query Service
Chenile Query Service customizes the orchestration framework to run a query that spans across multiple systems. Chenile query framework uses multiple commands to communicate with different micro services. These commands get orchestrated in parallel to produce a result. The output of the framework usually mirrors the way the commands are set up. However, this can be over-ridden by the commands. The query service uses the uses the owiz parallel chain to spawn multiple threads (from one thread pool)  to execute multiple Micro Service requests in parallel

Micro Service commands are responsible to obtain results from individual micro services whilst the parallel chains execute commands under them in parallel and aggregate the results with a timeout. The query framework is capable of handling partial success by returning a HTTP status code 206. 

![Query Framework](/images/chenile/query.png)

In the above diagram, profile has three first level keys such as tax, partner and returns. The returns directly communicates with a Micro service to fetch relevant information. tax and partner in turn call other sub commands to interact with the respective micro services. profile,tax and partner are parallel chains while the other commands are Micro service commands. 


