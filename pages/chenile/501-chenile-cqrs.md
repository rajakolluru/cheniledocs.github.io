---
title: CQRS Pattern
keywords: chenile  cqrs
sidebar: chenile_sidebar
toc: true
permalink: /chenile-cqrs.html
folder: chenile
summary: Chenile - CQRS Pattern
---
The Command Query Responsibility Pattern (CQRS) is a recommended strategy in a microservices ecosystem. Typically, in a Microservices ecosystem, the data is fragmented into multiple databases. However, the front end and other consumers desire data in a consolidated fashion. Data needs to be sliced differently in accordance to what the consumers need. For example in an ecommerce situation, the search engine may require data in a different way than the admin grids. 

Chenile recommends a CQRS pattern which can scale in complexity as the requirements evolve. See the diagram below:

![Chenile CQRS](/images/chenile/chenile-cqrs.png)

As we see the command services write to the command databases which will dump all their data into a query database. The query users access the query database for their needs. 

In a simple setup (with a start up for example) we might fuse the entire data layer into one database. In this way, we dont need to deal with event queues and multiple databases. 

Also Chenile recommends an ORM framework (such as JPA) to write to the command databases whilst it recommends Mybatis to read the query database. ORM ensures modularity. Mybatis avoids the (n+1) selects problem. 

<div class='well'>
	<div class="panel panel-default text-center">
                <div class="panel-body">
                    <h4>(n+1) selects problem</h4>
                    <p>
                    	The (n+1) selects problem happens when a call to a service (or a database query) returns n rows. For each row, we will then make another call to the database to fetch more information. This happens because the data might be residing in multiple databases. Hence we need to query one database and then for every row returned, we will have to query the second database.
                    </p><p> 
                    	An (n+1) selects problem immediately makes a problem into an O(n) problem. On the other hand, the database leverages indexing capability and makes sure that a problem becomes O(log N) problem. This is an important optimization. It keeps queries manageable. 
                    </p>                
                </div>
            </div>
</div>

We will look at how Chenile implements a generic query service with support for pagination, sorting etc. in another article. 

