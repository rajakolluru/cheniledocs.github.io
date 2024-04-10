---
title: Chenile Workflow Blue Print - Tutorial
keywords: chenile  stm state-transition fsm finite-state tutorial
sidebar: tutorial_sidebar
toc: true
permalink: /chenile-workflow-tutorial.html
folder: chenile
summary: Chenile - STM & Workflow tutorial
---
We will construct a state machine and explore some of its features. We can use app-gen to generate a basic workflow engine and try to understand what got generated. But we will use chenile-samples for this article instead. [Clone chenile-samples first](https://github.com/rajakolluru/chenile-samples). 

A workflow service is a typical Chenile service that is generated using the Chenile workflow blue print. We will explain this blue print in depth in this article. _issue_ is an example of a Chenile workflow blue print project. 

Like any other service, it has issue-api and issue-service. 
## issue-api - defining the model object
Let us look at issue-api first. We want to define an API (Java interface) for managing issues. The Chenile workflow blue print has standardized this interface already. This exists already in [workflow-api under Chenile](https://github.com/rajakolluru/chenile/tree/main/workflow-api). The interface in question is org.chenile.workflow.api.StateEntityService<T extends AbstractStateEntity>. So issue-api does not need to redefine this. Let us look at what workflow-api has already defined for this contract.
{% highlight java %}
// from workflow-api in Chenile
package org.chenile.workflow.api;

import java.util.List;
import java.util.Map;

import org.chenile.stm.State;
import org.chenile.workflow.dto.StateEntityServiceResponse;
import org.chenile.workflow.model.AbstractStateEntity;

public interface StateEntityService<T extends AbstractStateEntity> {
	public StateEntityServiceResponse<T> process(T entity, String event, Object payload);
	public StateEntityServiceResponse<T> processById(String id, String event, Object payload);public StateEntityServiceResponse<T> create(T entity);
	public StateEntityServiceResponse<T> retrieve(String id);	
	public List<Map<String, String>> getAllowedActionsAndMetadata(State state);
	public List<Map<String, String>> getAllowedActionsAndMetadata(String id);
}

{% endhighlight %}

It merely needs to use it for Issue entity which we will define by extending AbstractStateEntity.

{% highlight java %}
package org.chenile.samples.issue.model;

import org.chenile.workflow.model.AbstractStateEntity;

public class Issue extends AbstractStateEntity{
	private static final long serialVersionUID = 5943127292911636088L;	
	public String assignee;
	public String assignComment;
	public String closeComment;
	public String resolveComment;
	public String description;
	public String openedBy;
}
{% endhighlight %}

As we see above, it extends AbstractStateEntity and gives additional fields that are required for an issue such as assignee , assignComment etc. Thus the contract is defined by StateEntityService&lt;Issue&gt;

## Issue States 
Issue supports multiple states. We will show them here to understand the issue workflow better. Consider the diagram below:
![Issue Flow](/images/chenile/issue-flow.png)

We see multiple states and events such as "assign", "resolve", close" etc. We will pick the "assign" event and state the payload object that is required to trigger the event. In this case, we call it AssignIssuePayload which we define as follows:
{% highlight java %}
package org.chenile.samples.issue.model;

import org.chenile.workflow.param.MinimalPayload;

public class AssignIssuePayload extends MinimalPayload{
	private static final long serialVersionUID = 7166835437051551936L;
	public String assignee;	
}
{% endhighlight %}

Notice here that we are extending MinimalPayload which is already defined in workflow-api. Minimal Payload contains one comment as a String. Here we are capturing assignee as well as another field. 

It is recommended that people use at least MinimalPayload as the payload type for all events. BHowever Chenile does not enforce this recommendation. 

So this is all we need for issue-api. We need to define the workflow entity and any other payloads required for the workflow events. Let us move to issue-service.

## issue-service - Implementing the issue contracts
We know that the StateEntityService&lt;Issue&gt; has already defined the Issue service contract. We now need to implement the contract. The good news is that this contract is already implemented as well. It is in workflow-service in Chenile. So we don't need to implement it. We just need to instantiate it with the Issue State Machine. We will make that by defining a State Transition Diagram for Issue called states.xml. 
You will find the state transition diagram for Issues under issue-service/src/main/resources/org/chenile/samples/issue/states.xml which is defined as follows:
{% highlight xml %}
<states>
	<event-information eventId='assign' meta-bodyType='org.chenile.samples.issue.model.AssignIssuePayload'/>
	<event-information eventId='resolve' meta-bodyType='org.chenile.workflow.param.MinimalPayload'/>
	<event-information eventId='close' meta-bodyType='org.chenile.workflow.param.MinimalPayload'/>
	<default-transition-action componentName="issueBaseTransitionAction"/>
	
	<flow id='test-flow' default='true'>
		<entry-action componentName="issueEntryAction"/>
		<exit-action componentName="issueExitAction"/>
		<manual-state id='OPENED' initialState='true'>
			<on eventId='assign'  newStateId='ASSIGNED' componentName='assignIssue'/>
		</manual-state>

		<manual-state id='ASSIGNED'>
			<on eventId='resolve' newStateId='RESOLVED' componentName='resolveIssue'/>
		</manual-state>
		<manual-state id='RESOLVED'>
			<on eventId='close' newStateId='CLOSED' componentName='closeIssue'/>
		</manual-state>
		<manual-state id='CLOSED' />
	</flow>
</states>
{% endhighlight %}
Key features to note about this XML include the following:
1. The event-information section on the top is used to define the payload for each event. We will see how this information is used later.
2. Both entry and exit actions are defined. The entry action is used for persisting the issue into a database. It needs to be injected with an IssueStore which we will discuss later.
3. All states and events are defined. 
4. Handlers are defined for all events. 


## Handler code
The handlers are responsible for handling events. They must comply with a special signature defined in Chenile STM. Let us look at the "assign" handler. We define it as follows:
{% highlight java %}
package org.chenile.samples.issue.service.cmds;

import org.chenile.stm.STMInternalTransitionInvoker;
import org.chenile.stm.State;
import org.chenile.stm.action.STMTransitionAction;
import org.chenile.stm.model.Transition;

import org.chenile.samples.issue.model.AssignIssuePayload;
import org.chenile.samples.issue.model.Issue;

public class AssignIssueAction implements STMTransitionAction<Issue>{

	@Override
	public void doTransition(Issue issue, Object transitionParam, State startState, String eventId,
			State endState, STMInternalTransitionInvoker<?> stm, Transition transition) throws Exception {
		AssignIssuePayload payload = (AssignIssuePayload) transitionParam;
		issue.assignee = payload.assignee;
		issue.assignComment = payload.getComment();
	}

}
{% endhighlight %}

Things to note above:
1. All handlers must implement STMTransitionAction for that workflow entity. (in this case Issue) 
2. Handlers can assume that the payload can be casted to the correct payload defined in event-information. In this case it is AssignIssuePayload that we had defined in issue-api. 
3. The handler code can mutate the state entity (Issue) but should not persist it. We will rely on the Entry action to persist it. The entry action will call an EntityStore which we will next implement for Issue. 

## Entity Store 
We gave a trivial implementation of the Issue entity store using a hashmap. We should ideally use an ORM to do this.

Here is the code for that:
{% highlight java %}
package org.chenile.samples.issue.service.store;

import java.util.HashMap;
import java.util.Map;

import org.chenile.utils.entity.service.EntityStore;
import org.chenile.samples.issue.model.Issue;

public class IssueEntityStore implements EntityStore<Issue>{
	private Map<String, Issue> theStore = new HashMap<>();
	public static int counter = 1;
	@Override
	public void store(Issue entity) {
		if (entity.getId() == null) {
			entity.setId(counter++ + "");
		}
		theStore.put(entity.getId(), entity);		
	}
	@Override
	public Issue retrieve(String id) {
		return theStore.get(id);
	}
}
{% endhighlight %}
In this case, we just use the store method to generate an ID if applicable and store it in the hashmap. The store needs to be injected into the entry action. The entry action is again generic and defined in workflow-service. 

## Defining the controller
Next we need to define the issueService and register it in Chenile. We should also expose this using HTTP. We accomplish this by writing the following code:
{% highlight java %}
package org.chenile.samples.issue.configuration.controller;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import org.chenile.base.response.GenericResponse;
import org.chenile.http.annotation.BodyTypeSelector;
import org.chenile.http.annotation.ChenileController;
import org.chenile.http.annotation.ChenileParamType;
import org.chenile.http.handler.ControllerSupport;
import org.springframework.http.ResponseEntity;

import org.chenile.workflow.model.AbstractStateEntity;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.chenile.workflow.dto.StateEntityServiceResponse;
import org.chenile.samples.issue.model.Issue;

@RestController
@ChenileController(value = "issueService", serviceName = "_issueStateEntityService_",
		healthCheckerName = "issueHealthChecker")
public class IssueController extends ControllerSupport{
	
	@GetMapping("/issue/{id}")
	public ResponseEntity<GenericResponse<StateEntityServiceResponse>> retrieve(
			HttpServletRequest httpServletRequest,
			@PathVariable String id){
		return process("retrieve",httpServletRequest,id);	
	}

	@PostMapping("/issue")
	public ResponseEntity<GenericResponse<StateEntityServiceResponse>> create(
			HttpServletRequest httpServletRequest,
			@ChenileParamType(AbstractStateEntity.class)
			@RequestBody Issue entity){
		return process("create",httpServletRequest,entity);	
	}

	
	@PutMapping("/issue/{id}/{eventID}")
	@BodyTypeSelector("issueBodyTypeSelector")
	public ResponseEntity<GenericResponse<StateEntityServiceResponse>> processById(
			HttpServletRequest httpServletRequest,
			@PathVariable String id,
			@PathVariable String eventID,
			@ChenileParamType(Object.class) 
			@RequestBody String eventPayload){
		return process("processById",httpServletRequest,id,eventID,eventPayload);	
	}


}
{% endhighlight %}
Notice the following:
1. We are exposing only three operations via HTTP.
2. The create and retrieve methods are straightforward. However, the processById() method has a caveat. It has an event Payload which depends on the eventID (as defined in the event-information in the XML above). Now we need something to let Chenile know what is the payload type so that Chenile can use this information to serialize from JSON to the appropriate payload type. 
We use a bodyType selector to accomplish this. We don't need to write a new issueBodyTypeSelector. It is already there in workspace-service. We just need to make sure that it is injected with the correct state machine. 

## Instantiating the service, handler, store etc.
Now that we have the entire XML and Java code defined, let us see how to instantiate the State machine and all the handlers and store and body type selector. Please browse the code under issue-service/src/main/java/org/chenile/samples/issue/configuration. 
The __IssueConfiguration__ takes care of instantiating all the beans and the State machines and injects the relevant stuff. We would not repeat that code here. Instead please see the samples code. 

This completes the work required to make a workflow service in compliance to the Chenile workflow blue print. 

## Test cases etc.
The test cases test this entire construction. We will let you read them for yourselves.

