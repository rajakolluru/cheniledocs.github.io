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

The List of response rows gives the data back (in the row field) along with a list of AllowedActionInfo that specifies what actions are available for the row. Label specifies what should be the label that must be displayed in the UI (perhaps in a button). link specifies the link to be called when the button is pressed. isCombinable specifies if the action can be combined if multiple rows are highlighted by the user. For example, can we highlight multiple Orders and close them all in one shot. 

Finally, SearchResponse gives back metadata about each column that has been returned. Name, columnName and ColumnType are obvious. Is the column sortable or filterable. If the column type is drop down the drop down values are also returned. It also specifies if a column can be used for a containsQuery or betweenQuery or likeQuery. This is useful to construct search filters.

Chenile provides a Mybatis Service that implements SearchService. This is exposed using a controller at the URL /q/{queryName}. Thus Chenile includes all the code to not only define the service but also to execute it using Mybatis against a database. No code is necessary for executing anything. 
The only task remaining is to write the Mybatis queries and define the query meta data. 

That will be discussed as part of the Chenile tutorial.

