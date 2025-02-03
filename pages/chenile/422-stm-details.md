---
title: Using the Chenile state machine
keywords: chenile  stm state-transition fsm finite-state
sidebar: chenile_sidebar
toc: true
permalink: /chenile-stm-details.html
folder: chenile
summary: How to configure and use the Chenile State Machine for a workflow - A to Z 
---

The Chenile STM (State Transition Machine) is a very robust open source implementation of a state 
machine. It is extremely configurable. It supports a host of features that make it invaluable. 
STM is available as a simple library that can be used with minimal dependencies. Chenile also 
ships with a workflow service and a workflow code generator. The combination of these features makes
it a workhorse. 

We will delve into these features in depth in this article. We will also introduce the Chenile test
cases which make using the STM a cinch. We will also show some sample code in the 
[chenile-samples](https://github.com/ajapros/chenile-samples) repository. 

First of all some basics.

## State Machine Basics

Many entities in real life have a lifecycle. You can only perform a small set of actions on these 
entities. The actions are called events. They depend on the "state" of the entity. For example, take 
an e-commerce Cart. 
The Cart has a certain lifecycle. When it gets created, you can add items to the Cart or user can login
and be added as a user attached to the Cart. 

A state machine is often seen as the best way to model this workflow. You can look at this example in 
the STM [test case](https://github.com/ajapros/chenile-core/tree/main/stm/src/test/java/org/chenile/stm/test/basicflow) 
and the [associated states definition](https://github.com/ajapros/chenile-core/blob/main/stm/src/test/resources/org/chenile/stm/test/basicflow/cart.xml)
 
In this conceptual model, the Cart originates in a CREATED state till a payment is initiated. 
After payment is initiated, it becomes a PAYMENT_INITIATED 
Cart. When the "confirmPayment" event is received on a PAYMENT_INITIATED cart then it can become a 
PAYMENT_CONFIRMED cart if some condition is satisfied. (testObj == 1). Else it perpetually stays in
PAYMENT_INITIATED state. Meanwhile, events such as userLogin and addItem do not change the state of 
the Cart from CREATED. 
As we can see, these events change as the Cart navigates between different states. 
In the final state, no event can be performed against the Cart.

Entities such as Cart are called State Entities since they go through these States. The State itself
is a construct that encapsulates the current disposition of the entity.
Here is a simple state diagram for the Cart flow that has been captured. The STM ships with a CLI
(Command Line Interface) that enables the generation of the image from the resource file.

[![State machine for the process](/images/chenile/cart.png)](/images/chenile/cart.png)

## The XML State Transition Diagram 

Chenile STM supports XML for the definition of state transitions. XML provides for an extensible 
way of capturing the state transitions and can be customized substantially. We will start with the 
basics here from the test case XML file.

{% highlight xml %}

<states>
<flow id='cart-flow' default='true'>
    <security-strategy componentName="org.chenile.stm.test.basicflow.MockSecurityStrategy"/>
    <entry-action componentName="org.chenile.stm.test.basicflow.EntryAction" />
    <exit-action componentName="org.chenile.stm.test.basicflow.ExitAction" />
		
    <manual-state id='CREATED' initialState='true' meta-mainPath="true">
        <on eventId='close' newStateId='CLOSED'
			    invokableOnlyFromStm='true'/>
        <on eventId='addItem' componentName='org.chenile.stm.test.basicflow.AddItem' />
        <on eventId='userLogin' componentName='org.chenile.stm.test.basicflow.UserLogin' />
        <on eventId='initiatePayment' componentName='org.chenile.stm.test.basicflow.InitiatePayment'
				newStateId='PAYMENT_INITIATED' />
    </manual-state>

    <manual-state id='PAYMENT_INITIATED'  meta-mainPath="true">
        <on eventId="approve" componentName="org.chenile.stm.test.basicflow.ApproveCart"   meta-mainPath="true"/>
        <on eventId="confirmPayment" componentName='org.chenile.stm.test.basicflow.ConfirmPayment'
            newStateId='TEST_STATE'   meta-mainPath="true"/>
    </manual-state>
		
    <if id='TEST_STATE' condition='approved'
          then='confirm' else='reject'>
       <on eventId='confirm' newStateId='PAYMENT_CONFIRMED'  meta-mainPath="true"/>
       <on eventId='reject' newStateId='PAYMENT_INITIATED'/>
    </if>

    <manual-state id='PAYMENT_CONFIRMED'  meta-mainPath="true"/>
    <manual-state id='CLOSED'/>
</flow>

</states>

{% endhighlight  %}

The core flow is defined between the "flow" tags. The states are defined using the "manual-state" tags.
The first state is called the "initialState". There can only be one initialState that is possible for 
a flow. (If multiple initial states are possible, we will need to choose between them using an auto
state that we will discuss in more detail later in this document)

Inside the "manual-state" tags, the applicable events are defined using the "on" tags. The events
might result in a transition to another state. The "newStateId" attribute specifies the new state to 
which the transition occurs. In the absence of the "newState" attribute, the event does not result in 
a transition. The entity stays in the same state.

The "componentName" attribute provides a hook to the Java code that needs to be executed when the 
event has happened to the State entity. This hook invokes a command that implements a specific interface.
Commands can be created using any bean factory. The STM supports any bean factory via the
[BeanFactoryAdapter](https://javadoc.chenile.org/org/chenile/stm/impl/BeanFactoryAdapter.html) 
interface. The STM ships with an [implementation of this interface for Spring](https://javadoc.chenile.org/org/chenile/stm/spring/SpringBeanFactoryAdapter.html)

In most of the STM test cases, the Bean factory is mocked so that the test case can run without the 
Spring container. We will discuss about STM commands below.

## State Transition Diagram using Fluent API

Chenile STM also supports fluent API to define the same state transition diagram. This is illustrated
in a variation of the test case. Please see [the fluent API test case](https://github.com/ajapros/chenile-core/blob/main/stm/src/test/java/org/chenile/stm/test/basicflow/TestCartFlowFluentAPI.java)

## Chenile STM API
Chenile STM exposes the following API for using the STM:

## Key Java Interfaces
We will discuss the key Java interfaces below:

### StateEntity
The [StateEntity interface](https://javadoc.chenile.org/org/chenile/stm/StateEntity.html) needs
to be implemented by any State entity whose lifecycle should be controlled by the Chenile STM. This 
interface will need to implement the getCurrentState() method that returns the State of the entity.
The entity [State](https://javadoc.chenile.org/org/chenile/stm/State.html) is defined by a combination of 
_flowId_ and _stateId_. 

### STM Commands 
Chenile STM supports the following types of commands:
* [Entry Command](https://javadoc.chenile.org/org/chenile/stm/action/STMAction.html)
* [Exit Command](https://javadoc.chenile.org/org/chenile/stm/action/STMAction.html)
* [Transition Command](https://javadoc.chenile.org/org/chenile/stm/action/STMTransitionAction.html) (more appropriately called the event command since it is invoked even if there 
is no transition)

The Entry and exit commands are defined using the <entry-command/> and <exit-command/> tags. These 
tags are typically defined for the flow but can be overridden at the state level as well for particular
states. They are invoked when a state is entered or exited. 

The transition command or the Event command is the key hook to write specific code for accomplishing 
the transition. 

### Default State Transition Action
The STM supports the notion of a default transition action. This is called (if set) when the specific
event does not explicitly set a transition action. The Workflow blueprint uses this feature to 
enforce some conventions over configurations. We will discuss that in the Workflow blueprint article.


### Command Calling Sequence
Chenile STM calls the commands in a sequence that depends on some conditions. 
#### First Time Invocation
When Chenile STM is called for the first time on a newly created StateEntity then it 
moves the StateEntity to the initial state that is defined in the State Transition Diagram. After this,
it executes the entry action that has been configured. This can be the entry action at the flow level
or the entry action that is configured for the initial state. 

#### Invoking Events on a State
When an event is invoked for a particular state, the following sequence of commands is executed:
1. The exit action of the current state. 
2. The transition action configured for the event. In case it is not configured and a default transition 
action is configured for the flow, then the default transition action is invoked.
3. The entry action of the next state in case this event resulted in a transition. If the event does 
not result in a transition, then the entry action is still called for the current state.
4. In case we have reached an end state i.e. if there are no transitions that are applicable for 
the new state, then the exit action of the new state is also called once. 

## Auto State
Chenile STM supports the notion of an Automatic State Computation or auto-state. The auto state is like any other state
except that the events are computed algorithmically rather than being received from the outside. 

This is useful in certain situations:
1. Sometimes it is not possible to know the "to state" for the entity. This can also be the initial state. Hence, we 
might have to do a computation to figure out the next state.This computation is modeled as an auto-state that emits
events which leads to the next state. 
2. In case there are concurrent events (activities) that are possible for a state and it is not possible to transition 
to the subsequent state until all the concurrent events are completed. In this case, the auto state will inspect 
the entity and ensure that all the activities have been completed. On successful completion, we would advance to the next
state. Otherwise, we stay in the previous state. 
3. Anyplace where there is computation involved to arrive at the next state.

In the testcase above, TEST_STATE is an auto-state. It is computed by evaluating an expression. In this 
case, the expression is approved. If approved is true then an event "confirm" is returned else "reject" 
is returned. Based on these events, the entity moves to the PAYMENT_CONFIRMED or PAYMENT_INITIATED respectively.

The auto state can also be used to determine the initial state of the entity. Let us say, we use an Application process.
We might have states that denote to what extent the application is filled. The Application can be loaded into the system
from various sources. It can be initially put in a state depending on the state of completion of the application form. 
An auto-state can govern this determination of initial state.

## Support for Security Strategy
The State machine should be aware of the Security permissions associated with each event. Chenile STM captures security
as metadata. The attribute is "meta-acls".  By associating an event with a security ACL (Access Control List) the chenile
STM can validate if an action that is performed on the state entity is valid. Security Strategy obtains all the ACLs 
that are allowed for the signed in user. Security Strategies must implement the [Security Strategy interface](https://javadoc.chenile.org/org/chenile/stm/STMSecurityStrategy.html)

This strategy contains the isAllowed() method that returns true if an ACL (represented as a string) is allowed for the 
current signed-in user. STM is not able to provide the user name (simply because it is not passed as an explicit input
to the STM in its signature). Hence, the security strategy must use alternate means such as Thread Locals to know who
is the current signed-in user. 

In the above example, the [MockSecurityStrategy](https://github.com/ajapros/chenile-core/blob/main/stm/src/test/java/org/chenile/stm/test/basicflow/MockSecurityStrategy.java)
provides a simple implementation of Security Strategy. It obtains the username from a thread local and returns true for a
valid user irrespective of the ACLs. 


### What checks are made by the State Machine?
The State machine makes the following checks to ensure the sanity of the StateEntity:
1. The StateEntity must exist in a valid state that is defined in the State Transition Diagram (STD).
In case, the StateEntity has an invalid state then the STM throws an error. This only happens when 
the state is set without using STM.  STM will never set an entity to a state that is not defined in 
the STD. In short, all state manipulations of the entity must be done only using STM.
2. In case an invalid event is passed to the STM for the entity, the STM throws an error. The STM will
not allow unspecified events to be invoked on the StateEntity.
3. In case a valid event is passed but using the wrong credential, then the STM throws an error to 
indicate that the current event is illegal for the current security Principal. 