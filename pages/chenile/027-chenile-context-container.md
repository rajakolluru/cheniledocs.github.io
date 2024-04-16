---
title: Chenile Context Container
keywords: chenile  exchange context
tags: chenile context container
sidebar: chenile_sidebar
toc: true
permalink: /chenile-context-container.html
folder: chenile
summary: Chenile Context Container - which stores the context of the request when the exchange is not available
---
Consider the request processing in Chenile. Let us take an OrderService which has the following signature:

{% highlight java %}
public interface OrderService {
	// Create an Order and return the newly created Order
	public Order create(Order user);
}
{% endhighlight %}

The request navigates through interceptors before it reaches the OrderService as explained in the [request processing pipeline](/chenile-request-processing.html). The interceptors have full access to the context of the request since they accept a [Chenile Exchange](/chenile-exchange.html). 

The service signature accepts only the Order object as shown above. Let us say the service invokes the DAO layer which needs to persist the Order. The DAO layer might want to store details about the request such as the User ID of the person who initiated the Order, the channel that was used to initiate the order, trajectory ID information etc. These fields typically reside in the HTTP Header and are therefore not accessible to the OrderService and the DAO layer that it is calling. How do we solve this problem?

One alternative is to accept the ChenileExchange everywhere thereby making the signature unweildy. So we need to rewrite the signature as follows:

{% highlight java %}
public interface OrderService {
	// Create an Order and return the newly created Order
	public Order create(ChenileExchange exchange, Order user);
}
{% endhighlight %}

This is the only way to handle these kinds of requirements in reactive environments such as Reactive Java, Go Lang , Javascript etc. where a request is not tied to one thread. However, in Spring Boot, the request processing is handled by the servlet container which binds it to a single thread. In this situation, we can keep the service unaware of the exchange by using a ThreadLocal object that binds itself to the request thread. 

The ContextContainer provides access to such an object. The context container is populated by one of the interceptors. It contains all the header information (typically headers that start with "x-"). This information can then be used by downstream classes such as Dao layer by injecting the Context Container into themselves. So the OrderDao can look like this:
{% highlight java %}
public class OrderDao {
	@Autowired ContextContainer contextContainer;
	// Create an Order and return the newly created Order
	public Order persistOrder( Order user){
		order.setUser(contextContainer.get("x-user"));
		// some persistence code
	}
}
{% endhighlight %}

In this way, services dont have to be aware that they are getting orchestrated by Chenile. 


