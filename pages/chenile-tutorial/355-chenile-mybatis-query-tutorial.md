---
title: Chenile Mybatis Query Tutorial
keywords: mybatis tutorial chenile
tags: mybatis tutorial chenile
sidebar: tutorial_sidebar
toc: true
permalink: chenile-mybatis-query-tutorial.html
folder: chenile-tutorial
summary: How to write a new Mybatis based query in Chenile?
---
Please do read about the [Chenile Query framework](/chenile-mybatis-query-service.html) before you read this tutorial. That would give you some context on what is Chenile Mybatis Query. As we saw there, Chenile already has a configured query to fetch data from a query database using Mybatis. We can configure new queries to execute in Mybatis. No code needed!

We will see how to do this in this article. Please download the [student-query-service from chenile samples](https://github.com/rajakolluru/chenile-samples)

## Understanding the configurations in student-query-service
You will find that there is no code in src/main/java. We straightaway skip to configurations at src/main/resources. By convention, we use com.{companyname}.{orgname}.query.service.mapper to keep the configuration files. The code generator uses that convention to generate the code. For the samples, we used org.chenile.samples instead of com.{companyname}.{orgname}. 

You will find two files. One is a typical Mybatis mapper file and the other one is a JSON file that contains the query meta data. Any query in Chenile needs to be configured using a query meta data file. 

### The JSON file
First let us look at the JSON. 
{% highlight json %}
[
	{

        "id": "Student.getAll",
        "name": "students",
        "columnMetadata": {
			"id" : {
				"name": "id",
				"filterable": true,
				"columnType": "Text"
			},
			"name" : {
				"name": "name",
				"columnType" : "Text",
				"likeQuery": true,
				"filterable": true
			},
			"branch": {
				"name": "branch",
				"filterable": true,
				"columnType": "Text",
				"containsQuery": true,
				"sortable": true
			},
			"phone": {
				"name" : "phone",
				"filterable": true,
				"columnType": "Text"
			},
			"percentage" : {
				"name": "name",
				"columnType" : "Text",
				"filterable": true
			},
			"email": {
				"name": "email",
				"columnType" : "Text",
				"likeQuery": true,
				"filterable": true
			}
		},	
		"flexiblePropnames": false,
        "paginated" : true,
        "sortable" : true
    }
    
]
{% endhighlight %}

As you see , the query meta data is not tied to Mybatis. You can use this to configure any query in Chenile. We will support other types of queries in the future using the same meta data. Here we will use the id to map the query to mybatis. The name will be visible to the user. All requests to the getAll query would be made to /q/students. This would internally map it to the Mybatis Srudents.getAll query that will be defined in the mapper file. The column meta data is useful and will be passed verbatim in SearchResponse so that the UI can use this information to display the screen as stated in the [page on query framework](/chenile-mybatis-query-service.html)

It is important to explicitly enable pagination and sorting at the query level. Once the query is defined we can write the corresponding Mybatis mapper file. 

### The Mapper file
{% highlight xml %}
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">	
<mapper namespace = "Student">


<resultMap id = "result" type = "map">
   <result property = "id" column = "ID"/>
   <result property = "name" column = "NAME"/>
   <result property = "branch" column = "BRANCH"/>
   <result property = "percentage" column = "PERCENTAGE"/>
   <result property = "phone" column = "PHONE"/>
   <result property = "email" column = "EMAIL"/>
</resultMap>

<!-- the getAll query supports pagination. So make sure that there exists a count query
with the name getAll-count for such queries. Also all paginated queries must have 
${pagination} as part of them as shown below. -->
<select id='getAll-count' resultType="int" >
	select count(*) from student
    <where>
    <if test="branch != null">
         branch in
        <foreach item="item" index="index" collection="branch"
                 open="(" separator="," close=")">
            #{item}
        </foreach>
    </if>
    <if test="name != null">
        AND name like #{name}
    </if>
    <if test="phone != null">
        AND phone = #{phone}
    </if>
  </where>
</select>

<!-- The getAll query supports an elaborate where clause. 
The conditional constructs ensure that the clause is constructed only if 
specific filters are passed. Notice that 
branch supports an IN clause and name supports a like clause. 
This information must be reflected in the column meta data in the definitions JSON that 
accompanies this mapper.
Since this query is sortable the orderby clause is important.
Since this query supports pagination the ${pagination} is mandatory. 
We also need the count query above
Make sure that sortable and paginated are set to true in the corresponding query definitions 
-->
<select id = "getAll" resultMap = "result">	
   SELECT * FROM student
    <where>
    <if test="branch != null">
         branch in
	    <foreach item="item" index="index" collection="branch"
	             open="(" separator="," close=")">
	        #{item}
	    </foreach>
    </if>
    <if test="name != null">
        AND name like #{name}
    </if>
    <if test="phone != null">
        AND phone = #{phone}
    </if>
  </where>
  ${orderby} ${pagination}
</select>
    	
</mapper>

{% endhighlight %}

Here we define the getALl query in the student namespace. A few observations:
1. getAll is a paginated query. Since paginated queries need to explicitly return maxPages and maxCount it is important to define a "count query" as well. The count query is called getAll-count by convention. This allows Chenile to know where to look for it. 
2. The orderby and pagination variables need to be added verbatim at the end of the getAll query (not the count query). This allows pagination and sorting. The paginated and sortable fields in the query meta data (in the JSON) must be set to true. 
3. The count query has exactly the same where clause as the getAll query. 
4. like filters are treated using the key word like as shown above
5. between filters need to be treated using upper bound and lower bound (not shown in this example)
6. contains filters must have the foreach loop as shown above 

With these two files in place, you are all set. Please see the src/test/ for the testcases and feature files. 



