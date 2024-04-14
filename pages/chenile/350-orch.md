---
title: Chenile Orchestration
keywords: chenile  orchestration
sidebar: chenile_sidebar
toc: true
permalink: /chenile-owiz.html
folder: chenile
summary: Chenile - Orchestration
---
Orchestration is the process of running one or more commands in a certain order. Each command does a small slice of work.  All the slices of work add up to a sustantial outcome. The commands do little work by themselves but as the chain proceeds a bigger work is accomplished. This is akin to the Unix concept of pipes and filters. Doug McillRoy summarized this philosophy as follows:
>
This is the Unix philosophy: Write programs that do one thing and do it well. Write programs to work together. Write programs to handle text streams, because that is a universal interface.

This simple concept powered the entire Unix operating system and is used extensively in writing Unix shell programs. It is possible to construct a pipeline that combines basic commands to do some profound work. 

## The Java Implementation - Command and Context
In the context of a Java program, we define the following terms:
Command
: Commands are the individual units of work. They accomplish a small slice of functionality. 
Pipeline
: A pipeline is a collection of one or more Commands that are stitched in a certain way.Pipelines are typically stitched together during initialization. They execute during runtime.
Context
: The object that is passed around from one Command to the other in the pipeline. Doug called text streams as a Universal interface. In case of Java, a map can act as a universal interface since it consists of any kind of data as name-value pairs. Of course it is possible to have more specific interfaces according to the needs of the pipeline. That is why we use Context as generic in OWIZ so that we don't assume it to be a specific Java type.

## OWIZ - Orchestration Wizard
The Chenile orchestration framework (aka OWIZ - Orchestration  Wizard) is a pure Java implementation of the pipes and filters pattern. The individual commands get stitched into a micro orchestration that can be configured in multiple ways.
The Command is defined as follows:
{% highlight Java %}
package org.chenile.owiz;
// The InputType is the Context of the pipeline. As we see this is a generic and can be anything
public interface Command<InputType>{
	public void execute(InputType context) throws Exception;
}
{% endhighlight %}

## OrchConfigurators & AttachedCommands
OrchConfigurators read the configuration and stitch the pipeline. XMLOrchConfigurator is the best example of an OrchConfigurator. But there can be other configurators as well (as long as they support the OrchConfigurator interface)

To form complex pipelines we need the concept of an AttachableCommand. An AttachableCommand allows other Commands to attach themselves to it. This process is done during initialization and not during runtime. There are exceptions to this rule though which we will discuss later. The Attachable command supports an additional method attachCommand() defined as follows:
{% highlight Java %}
package org.chenile.owiz;
public interface AttachableCommand<InputType> extends Command<InputType> {
	public void attachCommand(AttachmentDescriptor<InputType> attachmentDescriptor, CommandDescriptor<InputType> command);
}
{% endhighlight %}
As we see above, the attachCommand allows other commands to be attached to a command. The perspicacious reader mqy have observed that CommandDescriptor and AttachmentDescriptor are used to describe the Command parameters and the attachment parameters. These descriptors provide metadata about the command and the way it must be attached. For example, the attachment desciptor can contain a map of elements that describe the attachment. This is specific to the implementation of the AttachmentCommand and will be described later. 

CommandDescriptor provides additional information such as the componentName which is the Spring name of the command or a class name that tells us that the command must be instantiated using normal Java reflection. If a class name is provided then it implies that the Command has an empty constructor. OWIZ does not act like Spring. It does not support multiple constructors and other stuff that a dependency injection framework will provide. 

## Other AttachmentCommands
The core OWIZ framework does not rely on specific AttachmentCommands. It treats all AttachmentCommands alike. Hence it can be extended to include new types of AttachmentCommands. OWIZ ships with some simple attachment commands to make it easy for people to use it with various chains.

Here are a few of them:

Simple chain
: A SimpleChain accepts a list of commands and serially executes them one after the other. A Simple chain attaches the commands in the order they are configured. However, it accepts the notion of an optional index as an attachment parameter. If the index is used then the commands are attached to the Chain in the ascending order of the index. 

Parallel chain
: ParallelChain extends a SimpleChain. However, the list of commands are executed in parallel to implement a scatter-gather pattern. The comamnds are executed to touch different parts of the Comtext object so that there is no danger of concurrent updates. The parallel chain terminates after a configurable amount of time (which defaults to 20 seconds if it is not specified)

Interception Chain
:  InterceptionChain constructs a ChainContext and executes the first Comamnd in a chain. The first command then can make a choice to continue the chain or return without executing the rest of the chain either by normal return or by throwing an Exception. The ChainContext allows the continuation of the chain till the last Command is reached. The Context needs to contain the ChainContext so that the ChainContext can be passed around within the Context. Hence the InterceptorChain assumes that the Context implements ChainContextContainer.  The InterceptorChain is useful to provide a decorator command implementation.

Router
: A router computes a routing string from the Context. Router is abstract and expects the subclasses to compute the routing string. Once a routing string is computed, the router executes one of several commands depending on the computed route. This can be used to implement customized logic that can differ by region, A-B tests or any other routing logic.

By combining these attachable command, it is possible to create extremely complex orchestrations. 

## Support for a DSL 
Chenile orchestration supports the creation of a domain specific language (DSL). The Spring names for the created beans allow for a flexible tagging support. New tags can be created and registered into OWIZ. The spring bean names can also be used as Owiz tags. For example, an owiz tag &lt;abc-def&gt; will look for a bean name abcDef in Spring. This bean is used in an orchestration. 

For a tutorial on owiz [please see this link](../chenile-tutorial/owiz-tut)