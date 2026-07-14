---
title: Chenile Mybatis Query Service
keywords: chenile  cqrs mybatis
sidebar: chenile_sidebar
toc: true
permalink: /chenile-mybatis-query-service.html
folder: chenile
summary: Chenile - Implementation of a Generic DB Query Service using Mybatis
---
Query consumers need flexible data that can span across multiple model objects. They may not need all the columns from all the objects. The query service must have a flexible data model to accommodate these requirements. We use maps to represent this data. 

## chenile-query-api 

Chenile has a query api that defines a SearchService. The SearchService is defined as follows:
{% highlight java %}
package org.chenile.query.service;

import org.chenile.query.model.SearchRequest;
import org.chenile.query.model.SearchResponse;

public interface SearchService<T> {
	public SearchResponse search(SearchRequest<T> searchInput);
}
{% endhighlight %}

The SearchService accepts a SearchRequest with a Generic for filter. It returns a SearchResponse. Let us next look at these two objects. 

{% highlight java %}
package org.chenile.query.model;

public class SearchRequest<FilterType> {
	int numRowsInPage = 10;
	int pageNum = 1;
	List<SortCriterion> sortCriteria = Collections.emptyList();
	FilterType filters;
	String queryName;
	List<String> fields;
		...
	}
	public class SortCriterion {
		private String name;
		private boolean ascendingOrder;
	}	
{% endhighlight %}

The request object accepts pagination parameters - pageNum specifies which page needs to be returned and numRowsInPage specifies the page size.  It also accepts a flexible sortCriteria which is a list of SortCriterion which in turn specifies the name of the column and the order of the sort. 
The queryName specifies the actual query that will be executed to return the results. 

Filters specify the where clause. 

If the client only needs the matching row count, set `countOnly` to `true` in the request. Chenile will execute only the `<queryId>-count` mapper, skip the main list query, return no rows, and populate `maxRows` and `maxPages` from the count result. This request-level flag takes precedence over global and query-level count settings, so it still runs the count query even when `query.pagination.countQueryEnabled=false`.

{% highlight json %}
{
  "countOnly": true,
  "filters": {
    "branch": ["Bangalore"]
  },
  "pageNum": 1,
  "numRowsInPage": 25
}
{% endhighlight %}

The SearchResponse looks like below:
{% highlight java %}
public class SearchResponse {
	private int numRowsReturned;

	private int currentPage;
	private int maxPages;
	private int numRowsInPage;
	
	private List<ResponseRow> list = Collections.emptyList(); 
	private Map<String, ColumnMetadata> columnMetadata = Collections.emptyMap();
	private int maxRows;
}

public class ResponseRow implements Serializable {
	private Object row;
	private List<AllowedActionInfo> allowedActions;	
}
public class AllowedActionInfo {
	public String label;
	public String link;
	public String name;
	public boolean isCombinable = false;
}
public class ColumnMetadata {
	public enum ColumnType {
		CheckBox, Number, DropDown, Text, Date, DateTime
	}

	private String name;
	private String columnName; 
	
	private String dropDownQuery;
	private boolean filterable;
	private boolean sortable;
	private boolean likeQuery;
	private List<String> dropDownValues;
	private ColumnType columnType;
	private boolean containsQuery;
	private boolean display = true;
	
	private boolean betweenQuery;
}
{% endhighlight %}
The pagination parameters are in response to what was requested. It returns the actual number of rows returned, the current page (which should be the pageNum but can be lesser if the number of pages is less than the pageNum passed), numRowsInPage (which is the same as what was passed), maxPages that specifies how many pages exist in the resultset. maxRows is the total count.

For paginated queries, Chenile runs the `<queryId>-count` mapper by default. Count execution can be disabled globally with `query.pagination.countQueryEnabled=false`. Individual query definitions can override the global setting by adding `countQueryEnabled`:

{% highlight json %}
{
  "id": "Student.getAll",
  "name": "students",
  "paginated": true,
  "countQueryEnabled": false
}
{% endhighlight %}

If `countQueryEnabled` is absent in the query definition, Chenile uses the global setting. If it is `false`, Chenile fetches one extra row and returns `pagination.nextPageAvailable` instead of exact `maxRows` and `maxPages`. If it is `true`, Chenile runs the count query even when the global flag is disabled.

Truth table:

| Query JSON `countQueryEnabled` | Global `query.pagination.countQueryEnabled` | Effective behavior |
| --- | --- | --- |
| `true` | `true` | Count query runs |
| `true` | `false` | Count query runs |
| `true` | absent | Count query runs |
| `false` | `true` | Count query does not run |
| `false` | `false` | Count query does not run |
| `false` | absent | Count query does not run |
| absent | `true` | Count query runs |
| absent | `false` | Count query does not run |
| absent | absent | Count query runs |

If `SearchRequest.countOnly=true`, Chenile runs the count query regardless of the table above and bypasses the list query.

So the priority is:

1. Request `countOnly=true`
2. Query JSON `countQueryEnabled`, if present
3. Global `query.pagination.countQueryEnabled`, if present
4. Framework default `true`

The List of response rows gives the data back (in the row field) along with a list of AllowedActionInfo that specifies what actions are available for the row. Label specifies what should be the label that must be displayed in the UI (perhaps in a button). link specifies the link to be called when the button is pressed. isCombinable specifies if the action can be combined if multiple rows are highlighted by the user. For example, can we highlight multiple Orders and close them all in one shot. 

Finally, SearchResponse gives back metadata about each column that has been returned. Name, columnName and ColumnType are obvious. Is the column sortable or filterable. If the column type is drop down the drop down values are also returned. It also specifies if a column can be used for a containsQuery or betweenQuery or likeQuery. This is useful to construct search filters.

Chenile provides a Mybatis Service that implements SearchService. This is exposed using a controller at the URL /q/{queryName}. Thus Chenile includes all the code to not only define the service but also to execute it using Mybatis against a database. No code is necessary for executing anything. 
The only task remaining is to write the Mybatis queries and define the query meta data. 

## Multi-Tenant Query Routing

Chenile query services are tenant aware. The active tenant is read from the Chenile context, normally populated from the `x-chenile-tenant-id` request header.

Configure query datasources under `query.datasources`:

{% highlight yaml %}
query:
  defaultTenantId: tenant1
  mapperFiles: classpath*:org/example/query/mapper/*.xml
  definitionFiles: classpath*:org/example/query/mapper/*.json
  datasources:
    tenant1:
      type: com.zaxxer.hikari.HikariDataSource
      jdbcUrl: jdbc:postgresql://localhost:5433/query_tenant1
      username: query_user
      password: query_password
    tenant2:
      type: com.zaxxer.hikari.HikariDataSource
      jdbcUrl: jdbc:postgresql://localhost:5433/query_tenant2
      username: query_user
      password: query_password
{% endhighlight %}

Tenant resolution rules are strict:

| Request tenant | `query.defaultTenantId` | Behavior |
| --- | --- | --- |
| present and configured | any | route to that tenant datasource |
| missing or blank | configured | route to default tenant and log a warning |
| missing or blank | absent or blank | reject the request with `Q723` |
| present but not configured | any | fail; Chenile does not silently fall back to default |
| default configured but not present in `query.datasources` | any | fail at startup/configuration time |

This prevents accidental cross-tenant reads. If the service is intended to be strictly header-driven, do not configure `query.defaultTenantId`.

## Tenant-Specific Query Overrides

Products can override a base query for a specific tenant/client without changing the public URL. The client still calls the same endpoint:

{% highlight text %}
POST /q/students
x-chenile-tenant-id: tenant1
{% endhighlight %}

The framework resolves metadata in this order:

1. Query definition with matching `tenantId` and `name`
2. Base query definition with matching `name`
3. `Q700` if neither exists

Base query definition:

{% highlight json %}
{
  "id": "Student.getAll",
  "name": "students",
  "paginated": true,
  "sortable": true,
  "columnMetadata": {}
}
{% endhighlight %}

Tenant override definition:

{% highlight json %}
{
  "tenantId": "tenant1",
  "id": "tenant1.Student.getAll",
  "name": "students",
  "paginated": true,
  "sortable": true,
  "columnMetadata": {}
}
{% endhighlight %}

The override is a full metadata replacement, not a merge. Put the full column metadata, ACLs, pagination flags, workflow metadata, and dropdown query metadata in the tenant definition.

For MyBatis, the tenant mapper namespace must match the tenant query id:

{% highlight xml %}
<mapper namespace="tenant1.Student">
  <select id="getAll-count" resultType="int">
    select count(*) from student where tenant_segment = 'premium'
  </select>

  <select id="getAll" resultType="map">
    select * from student where tenant_segment = 'premium' ${orderby} ${pagination}
  </select>
</mapper>
{% endhighlight %}

For the example above, Chenile executes `tenant1.Student.getAll` and `tenant1.Student.getAll-count`. A tenant without an override uses `Student.getAll` and `Student.getAll-count`.

That will be discussed as part of the Chenile tutorial.
