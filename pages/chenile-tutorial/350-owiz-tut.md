---
title: OWIZ Tutorial
keywords: OWIZ orchestration
sidebar: tutorial_sidebar
toc: true
permalink: owiz-tut.html
folder: chenile-tutorial
summary: A Tutorial for the Orchestration Wizard that powers Chenile and is shipped with it
---

# OWIZ Tutorial
This tutorial walks the user through creation of orchestrations using _owiz_. Please see the code samples [here](https://github.com/rajakolluru/chenile-samples.git)

## Set up
To set up using OWIZ, you need access to the OWIZ library. The following pom snippet will help this:
{% highlight xml %}
	<dependency>
		<groupId>org.chenile</groupId>
		<artifactId>owiz</artifactId>
		<version></version>
	</dependency>
{% endhighlight %}
Either, use the latest version of the library or alternately if your project depends on Chenile , then the version can be skipped. (make sure that chenile-parent is the super pom for your pom)

## The Context Class
The Context provides a mutable object that is progressively enhanced by the orchestration script.
Let us make a context called BaseContext

{% highlight java %}
	public class BaseContext extends HashMap<String,Object>{
		// ensures we keep track of the invocation order of all commands.
		public List<String> invocationOrder = new ArrayList<String>();
	}
{% endhighlight %}
This provides a placeholder to keep all kinds of information. We are going to keep a list of strings. Each command will add to the list. We can then make sure that the commands are executed in the correct order.

## The Command 
Next, we make a command called SimpleCommand that uses this BaseContext. All commands must implement an interface called Command which forces them to implement the execute method. 
{% highlight java %}
	public class SimpleCommand implements Command<BaseContext>{
		private String commandId;
		public SimpleCommand(String commandId){
			this.commandId = commandId;
		}
		@Override
		public void execute(BaseContext baseContext){
			// insert a key commandId with value "owiz" into the base context
			baseContext.put(commandId,"owiz");
			// Add to the invocation order so it can be asserted later
			baseContext.invocationOrder.add(commandId);
		}
	}

{% endhighlight %}
The command above ensures that it creates a key with the commandId in the base context. Additionally,it adds to the invocationOrder list so that the order of invocation can also be asserted.

## Instantiating the Command
Next, we instantiate three instances of SomeCommand in Spring and call these instances as _simpleCommand1_, _simpleCommand2_ and _simpleCommand3_. We also instantiate OwizSpringFactoryAdapter so that OWIZ becomes Spring aware. By default OWIZ is not spring aware and can be used with any bean factory.
{% highlight java %}
	@Configuration
	public class OwizTutConfiguration {
		@Bean public SimpleCommand simpleCommand1(){
			return new SimpleCommand("commandId1");
		}

		@Bean public SimpleCommand simpleCommand2(){
			return new SimpleCommand("commandId2");
		}

		@Bean public SimpleCommand simpleCommand3(){
			return new SimpleCommand("commandId3");
		}

		@Bean public OwizSpringFactoryAdapter owizSpringFactoryAdapter(){
			return new OwizSpringFactoryAdapter();
		}
	}

{% endhighlight %}
## The Test Harness
{% highlight java %}
@Configuration
@SpringBootApplication(scanBasePackages = { "org.chenile.tut.owiz" })
@ActiveProfiles("unittest")
public class SpringConfig extends SpringBootServletInitializer{
	
	public static void main(String[] args) {
		SpringApplication.run(SpringConfig.class, args);
	}
}
{% endhighlight %}
The class above sets up the infrastructure for writing unit tests. 

## Base Test Class
The base test class builds the orchestrator and asserts on the invocation order. It provides the base class for writing our test cases.  

### Constructing the Orchestrator
OWIZ provides an orchestrator and a reader for an Orchestration script. The objective is to feed an orchestration script to the orchestrator. We need to instantiate the orchestrator so that it is ready for use. XML is the chosen way to write the orchestration script. The script resides in _orch.xml_ which will be placed in the class path. 

Here is a simple snippet which allows us to make an OrchExecutor using _orch.xml_:
{% highlight java %}
	public OrchExecutor<BaseContext> obtainOrchExecutor(String file){
		XmlOrchConfigurator<BaseContext> xoc = new XmlOrchConfigurator<BaseContext>();
		xoc.setBeanFactoryAdapter(owizSpringFactoryAdapter());
		// Read the file that contains the orchestration. 
		xoc.setFilename(file);

		OrchExecutorImpl<BaseContext> orchExecutor = new OrchExecutorImpl<BaseContext>();
		orchExecutor.setOrchConfigurator(xoc);
		return orchExecutor;
	}
{% endhighlight %}

## Asserting Invocation Order
In the BaseTest class, we will also assert if the invocation order is as expected. To do that, we will need a method as shown below:
{% highlight java %}
// asserts if the commands have been invoked in the same order as expected
public void assertInvocationOrder(BaseContext context,String ...args) {
	List<String> list = Arrays.asList(args);
	assertEquals("Invocation order does not match expected invocation order",
				list,context.commandInvocationOrder);
}

{% endhighlight %}
With these classes in place, we are ready to write our orchestration scripts and tests. 

## The Simplest Example
 The simplest orchestration is to run one instance of the command (say _simpleCommand1_) and nothing else: 
orch1.xml
{% highlight xml %}
<flows>
	<flow>
		<command componentName="simpleCommand1" first='true'/>
	</flow>
</flows>
{% endhighlight %}

Since simpleCommand1 is the only command it will set the value of "simpleCommand1" to "owiz". We assert for that in the class below

## The Test Class
We will write different tests with different scripts. The test class is structured as below:
{% highlight java %}
public class Test1 extends BaseTest{	
	@Test public void testSimple() throws Exception {
		OrchExecutor<BaseContext> oe = obtainOrchExecutor("orch1.xml");
		BaseContext context = new BaseContext();
		oe.execute(context);
		assertEquals("commandId1 key not set correctly",context.get("commandId1"),"owiz");
		assertInvocationOrder(context,"commandId1");
	}   
}
{% endhighlight %}
We call the obtainOrchExecutor() with different files. Then we initialize the Base Context, invoke the orch executor and assert if the expected key exists. We also assert on the invocation order which in this case is just one command - commandId1

## Understanding the XML
The orchestration is composed of multiple flows. (each with a unique ID). Each flow can have multiple commands. In this case we are invoking "simpleCommand1" and expect that the key "simpleCommand1" has been set to "owiz". The "first" attribute in the command states that the simpleCommand1 must be the first command in the orchestration. In this case, it also happens to be the only command in the orchestration.

## Simplifying the XML further
The above XML is needlessly verbose. It can even be reduced by skipping "command" tag and the attributes that can be inferred such as "first". We can write a new XML file - orch2.xml as follows;
orch2.xml
{% highlight xml %}
<flows>
	<flow>
		<simpleCommand1/>
	</flow>
</flows>
{% endhighlight %}
The orchestration for orch2.xml is identical to that of "orch1.xml"

## Avoiding Camel Case
XML puritans will not like camel case in XML tags. They can instead use "orch3.xml" which looks like this:
orch3.xml
{% highlight xml %}
<flows>
	<flow>
		<simple-command1/>
	</flow>
</flows>
{% endhighlight %}
As expected, this produces the same results.

## Executing a chain of commands
The next step is to use commands one after the other. In this case, we would like to execute simpleCommand1, simpleCommand2 and simpleCommand3 one after the other.
The orch4.xml that is used is as follows:
orch4.xml
{% highlight xml %}
<flows>
	<flow>
		<chain>
			<simple-command1/>
			<simple-command2/>
			<simple-command3/>
		</chain>
	</flow>
</flows>
{% endhighlight %}
The chain tag above is mapped to a class called org.chenile.owiz.impl.Chain which is instantiated. This class runs all the commands contained inside one after the other.

We can easily test this by writing Test4.java that looks like:
{% highlight java %}
public class Test4 extends BaseTest{
	@Test public void testSimple() throws Exception {
		OrchExecutor<BaseContext> oe = obtainOrchExecutor("orch3.xml");
		BaseContext context = new BaseContext();
		oe.execute(context);
		System.out.println(context);
		assertEquals("commandId1 key not set correctly",context.get("commandId1"),"owiz");
		assertEquals("commandId2 key not set correctly",context.get("commandId2"),"owiz");
		assertEquals("commandId3 key not set correctly",context.get("commandId3"),"owiz");
		assertInvocationOrder(context,"commandId1","commandId2","commandId3");
	}   
}
{% endhighlight %}
The invocation order is as expected. The commands are invoked in the same order as they were configured in the XML.

## Changing the Invocation Order
Sometimes, it is possible that we would want to change the command invocation order. We may not want to keep the order of the commands the same as the order that they are inserted into the configuration. To accomplish this, the chain supports the notion of index. The commands will be invoked in the ascending order of index. 

Let us change the orch4.xml to orch4-a.xml
orch4-a.xml
{% highlight xml %}
<flows>
	<flow>
		<chain>
			<simple-command1 index='101'/>
			<simple-command2 index='98'/>
			<simple-command3 index='105'/>
		</chain>
	</flow>
</flows>
{% endhighlight %}
In this case, the expected order of invocation will be commandId2, commandId1, commandId3. 

## Micro-Routing
Sometimes, we want to execute things conditionally. For example, it is possible that we can have three alternate routes "route1", "route2" and "route3" that map to simpleCommand1, simpleCommand2 and simpleCommand3 respectively. Depending on the request, we will need to route the request to the appropriate command. 

For this, we use a special command called org.chenile.owiz.impl.Router that is available as part of _owiz_. Router is an abstract class. The sub classes of Router compute specific routes. We will discuss the first sub class here called org.chenile.owiz.impl.ognl.OgnlRouter. This router uses an expression language to specify routes. Let us say, that the route is stored within the BaseContext in a key called "myRoute". 

Here is some sample code to do the routing:
orch5.xml
{% highlight xml %}
<flows>
	<flow>
		<command componentName='org.chenile.owiz.impl.ognl.OgnlRouter' expression='myRoute'>
			<simple-command1 route='route1'/>
			<simple-command2 route='route2'/>
			<simple-command3 route='route3'/>
		</command>
	</flow>
</flows>
{% endhighlight %}
The OgnlRouter has been configured here to use an expression called "myRoute". This expression is then applied on the BaseContext to compute the route. In according with the route, it is possible to route it to various commands.

:::tip
### Using a custom command tag
It is completely possible to avoid verbosity by using a custom tag. For example, in orch5.xml above, the unweildy command tag can be replaced with a switch tag. In the above case here is the XML snippet.
{% highlight xml %}
orch6.xml
<flows>
	<add-command-tag tag='switch' componentName='org.chenile.owiz.impl.ognl.OgnlRouter'/>
	<flow>
		<switch expression='myRoute'>
			<simple-command1 route='route1'/>
			<simple-command2 route='route2'/>
			<simple-command3 route='route3'/>
		</command>
	</flow>
</flows>
{% endhighlight %}
:::

## Writing a Custom Router
As mentioned before, the Router class can be extended in a custom way. For example, to implement the same functionality as before, we can write a simple router as follows:
{% highlight java %}
public class MyRouter extends Router<BaseContext>{

	@Override
	protected String computeRoutingString(BaseContext context) throws Exception {
		return (String)context.get("myRoute");
	}

}
// In the spring configuration use the following:

	@Bean public MyRouter myRouter() {
		return new MyRouter();
	}
	
{% endhighlight %}
Code above instantiates this router in Spring. In the orch7.xml below, we map the spring name (as componentName) to a custom command tag.The command tag can  evaluate as before. 
orch7.xml
{% highlight xml %}
<flows>
	<add-command-tag tag='switch' componentName='myRouter'/>
	<flow>
		<switch>
			<simple-command1 route='route1'/>
			<simple-command2 route='route2'/>
			<simple-command3 route='route3'/>
		</command>
	</flow>
</flows>
{% endhighlight %}

### The Default Route
Routers can have a special route called "default". This will be used if the computed routing string does not match any of the available routes. In the absence of a default route, the Router throws an exception if the computed route from the router does not match any of the configured routes.

## Writing an interceptor chain
The normal chain invokes commands in sequence. The commands cannot abort the flow except by throwing exceptions. The Chain provides a restricted ability to abort the rest of the commands. However, it does not give the ability for commands to "decorate" the commands downstream to them. The commands are invoked only once. Sometimes when invoking services we need to have a decorator functionality. This allows commands to intercept the request, perform some actions and delegate the request to the rest of the commands in the Chain. After waiting for the downstream commands to complete the decorators can then perform other functionality. 

_Owiz_ provides an interception chain - org.chenile.owiz.impl.FilterChain. Interceptor chain requires a ChainContext. The ChainContext is completely opaque to the consumers and provides a functionality to continue the rest of the chain. The context object needs to support it by becoming a ChainContextContainer. So first of all, let us enhance our BaseContext to make it a ChainContextContainer.

{% highlight java %}
public class BaseContext extends HashMap<String,Object> implements ChainContextContainer<BaseContext>{
	private static final long serialVersionUID = 8594770021082667161L;
	
	@SuppressWarnings("unchecked")
	@Override
	public ChainContext<BaseContext> getChainContext() {
		return (ChainContext<BaseContext>) get("chainContext");
	}

	@Override
	public void setChainContext(ChainContext<BaseContext> chainContext) {
		put("chainContext", chainContext);
	}
}

{% endhighlight %}

Next, we create an Interceptor Command which can be used for intercepting all invocations.
{% highlight java %}
public class InterceptorCommand implements Command<BaseContext>{

	private String commandId;
	public InterceptorCommand(String commandId) {
		this.commandId = commandId;
	}
	@Override
	public void execute(BaseContext context) throws Exception {
		context.commandInvocationOrder.add( commandId + "pre");
		context.getChainContext().doContinue();
		context.commandInvocationOrder.add( commandId + "post");
	}

}
{% endhighlight %}
The interceptor command enhances the invocation order by adding a pre and post message.
As usual, we will make three interceptor instances in Spring. We will also instantiate the 
FilterChain:
{% highlight java %}
@Bean public FilterChain<BaseContext> filterChain(){
	return new FilterChain<>();
}
@Bean public InterceptorCommand interceptor1(){
	return new InterceptorCommand("interceptor1");
}
@Bean public InterceptorCommand interceptor2(){
	return new InterceptorCommand("interceptor2");
}
@Bean public InterceptorCommand interceptor3(){
	return new InterceptorCommand("interceptor3");
}

{% endhighlight %}
The orch.xml is similar to the chain and reads:
orch8.xml
{% highlight xml %}
<flows>
	<flow>
		<filter-chain>
			<interceptor1/>
			<interceptor2/>
			<interceptor3/>
		</filter-chain>
	</flow>
</flows>

{% endhighlight %}
Remember that filterChain, interceptor1, interceptor2 and interceptor3 are spring bean names and _OWIZ_ supports them in the XML seamlessly.

To validate this orchestration, here is a test:
{% highlight java %}
public class Test8 extends BaseTest{
	@Test public void testSimple() throws Exception {
		OrchExecutor<BaseContext> oe = obtainOrchExecutor("orch8.xml");
		BaseContext context = new BaseContext();
		oe.execute(context);
		assertInvocationOrder(context,"interceptor1pre", "interceptor2pre", 
				"interceptor3pre", "interceptor3post", "interceptor2post", "interceptor1post");
	}   
}

{% endhighlight %}
As expected, interceptor1, interceptor2 and interceptor3 are invoked in the order first and have the opportunity to do post processing in the reverse order. 

_FilterChain_ supports index as well. Hence it is possible to change the order by using _index_ as is the case with _Chain_. Look at orch8-a.xml for a sample.

## Parallel Chain
Parallel chain works very similar to filter chain and normal chain. It executes the constituent commands in parallel. See the _owiz_ test cases for more details.

## Attacheable Commands
_Owiz_ is highly extensible. For example, it is not aware of chains or routers. It supports any new command that implements the Command interface. Likewise, when a command implements Attacheable command, then other commands can attach to it. Chains & Routers are supported merely because they are attachable commands. There is no custom logic to treat them specially.

We can write our own AttachableCommand and use it to do our orchestrations. As an example, let us say we want to write a new Attachable command that accepts new commands. It checks on a key called "total". If total < 1000 it executes command1 else it executes command2

Here is an implementation of this command:
{% highlight java %}
public class TotalCommand implements AttachableCommand<BaseContext>{

	private CommandDescriptor<BaseContext> firstCommand;
	private CommandDescriptor<BaseContext> secondCommand;
	
	@Override
	public void execute(BaseContext context) throws Exception {
		Integer total = (Integer)context.get("total");
		if (total == null) total = 0;
		if (total < 1000) {
			firstCommand.getCommand().execute(context);
		}else
			secondCommand.getCommand().execute(context);
		
	}

	@Override
	public void attachCommand(AttachmentDescriptor<BaseContext> attachmentDescriptor,
			CommandDescriptor<BaseContext> command) {
		// check if the command is a first command or a second command
		if (attachmentDescriptor.get("type").equals("first")) {
			firstCommand = command;
		}else {
			secondCommand = command;
		}
		
	}

}

{% endhighlight %}
Command implements both attachCommand and execute methods. The attachCommand method is invoked when other commands attach themselves to this command. In this case, we check if there is an attachment parameter called "type" that is set to "first". If so, this command becomes firstCommand else it becomes secondCommand.

During the time of execution, the command checks the total value and either executes the first or second commands. 

We should instantiate it in Spring:
{% highlight java %}
@Bean public TotalCommand total() {
	return new TotalCommand();
}

{% endhighlight %}
Due to this, total becomes an xml key word that is supported by OWIZ. 
We will use an orchestration as follows:
orch9.xml
{% highlight xml %}

<flows>
	<flow>
		<total>
			<simple-command1 type='first'/>
			<simple-command2 type='second'/>
		</total>
	</flow>
</flows>

{% endhighlight %}
The test looks like this:
{% highlight java %}
public class Test9 extends BaseTest{
	@Test public void testFirst() throws Exception {
		OrchExecutor<BaseContext> oe = obtainOrchExecutor("orch9.xml");
		BaseContext context = new BaseContext();
		context.put("total", 800);
		oe.execute(context);
		assertEquals("commandId1 key not set correctly",context.get("commandId1"),"owiz");
		assertInvocationOrder(context,"commandId1");
	}  
	
	@Test public void testSecond() throws Exception {
		OrchExecutor<BaseContext> oe = obtainOrchExecutor("orch9.xml");
		BaseContext context = new BaseContext();
		context.put("total", 1500);
		oe.execute(context);
		assertEquals("commandId2 key not set correctly",context.get("commandId2"),"owiz");
		assertInvocationOrder(context,"commandId2");
	} 
}

{% endhighlight %}
If the total is < 1000 then commandId1 must be invoked else commandId2 must be invoked.

## Modular Configurations
_Owiz_ support modular configurations i.e. configurations that can be modularized into multiple files. 
As an example, let us take _orch6.xml_ which we will copy as orch10.xml with the following configuration:
orch10.xml
{% highlight xml %}
<flows>
	<add-command-tag tag='switch' componentName='org.chenile.owiz.impl.ognl.OgnlRouter'/>
	<flow id='flow1'>
		<switch id='myrouter' expression='myRoute'>
			<simple-command1 route='route1'/>
			<simple-command2 route='route2'/>
		</switch>
	</flow>
</flows>
{% endhighlight %}
The router allows us to choose between route1 and route2 depending on the value of "myRoute".
But let us say that we want to introduce a third route "route3" without changing the configuration. We can do that in another file and read both the files into the OWIZ configuration. 
Let us call this as orch11.xml with the following configuration:
orch11.xml
{% highlight xml %}
<flows>
	<add-command-tag tag='switch' componentName='org.chenile.owiz.impl.ognl.OgnlRouter'/>
	<flow id='flow1'>
		<simple-command3 route='route3'>
			<attach-to parentId='myrouter'/>
		</simple-command3>
	</flow>
</flows>
{% endhighlight %}
Here orch11.xml is supplementing the configuration in orch10.xml in a modular fashion. The attach-to tag allows a command to be attached to a parent separately without the child command being configured under the parent. 

If orch11.xml were not present, there would only be two routes. But with orch11.xml, the third route gets added incrementally. To achieve this, the switch in question (along with the flow that it belongs to) must have a unique identifier. 
:::tip
### Discovery
By default, owiz discovers all files with the same name across multiple jars. For example, it can find every instance of orch10.xml (across multiple jars). This allows for discoverability. People wishing to augment the owiz script needs to use the same file name and then add the incremental configurations there

:::

## Multiple Flows
_Owiz_ supports multiple flows each with its own flow ID. The default flow is the first flow that it encountered. A flow definition can span across multiple files. In such a situation, the flow must be given an ID. The same ID must be used for every flow definition so that the commands all get added to the same flow.

## Obtaining access to OWIZ configuration
A command must be agnostic to how it is participating in an orchestration. To that extent, the command must not rely on configurations passed through the XML files. However, there are times when the command must access the OWIZ configuration. 

The _OrchestrationAware_ interface allows the injection of the orch configurator and the command descriptor to the command. Alternately, commands can extend CommandBase that already implements this interface. Both orchConfigurator and commandDescriptor become available to the command. These can be used to get access to specific configuration from the orch xml files. 

### CommandBase
The CommandBase class implements the OrchestrationAware interface. In addition, it provides convenience methods for commands to obtain access to configuration values. 

## Create a sub command of CommandBase
Let us create a variation of the SimpleCommand which obtains the commandId from configuration rather than from the constructor. 
{% highlight java %}
public class OrchAwareCommand extends CommandBase<BaseContext>{
	@Override
	protected void doExecute(BaseContext context) throws Exception {
		String commandId = getConfigValue("commandId");
		context.put(commandId, "owiz");
		context.commandInvocationOrder.add(commandId);
	}
}

{% endhighlight %}

Next we put this into Spring as orchAwareCommand using the following snippet in the configuration class:
{% highlight java %}
@Bean public OrchAwareCommand orchAwareCommand() {
	return new OrchAwareCommand();
}

{% endhighlight %}

Next we write the following orchestration _orch12.xml_
orch12.xml
{% highlight xml %}

<flows>
	<flow>
		<orch-aware-command commandId='my-orch-aware-command'/>
	</flow>
</flows>

{% endhighlight %}
Finally, we test if the string "my-orch-aware-command" has been picked up as the ID from the configuration.
{% highlight java %}
public class Test12 extends BaseTest{
	@Test public void testOrchAwareCommand() throws Exception {
		String s = "my-orch-aware-command";
		OrchExecutor<BaseContext> oe = obtainOrchExecutor("orch12.xml");
		BaseContext context = new BaseContext();
		oe.execute(context);
		assertEquals("commandId1 key not set correctly",context.get(s),"owiz");
		assertInvocationOrder(context,s);
	}   
}
{% endhighlight %}

## A Complex Example
Here is a complex example for owiz orchestration:
1. We need to write a Query API for obtaining inventory for an item.
2. We also need to write a Query API for pricing.
3. Pricing and Inventory systems vary from region to region. To begin with we should target US and Mexico. 
4. Querying the US inventory system is easy - we just need to make a call to the Innova system.
5. For US pricing we need to query two systems - the Edge system called PEdge and the Cloud based system called Dolop
6. For MX, the inventory system is Queso and the pricing system is called Dinero

This requirement can be implemented using individual commands - InnovaCommand, PEdgeCommand, DolopCommand, QuesoCommand and DineroCommand which talk to respective systems. The orchestration will look as follows:
The flow can look like below:
{% highlight xml %}
<flows>
	<flow id='flow1'>
		<region-router>
			<parallel-chain route='US'>
				<innova-command/>
				<chain>
					<pedge-command/>
					<dolop-command/>
				</chain>
			</parallel-chain>
			<parallel-chain route='MX'>
				<queso-command/>
				<dinero-command/>
			</parallel-chain>
		</region-router>
	</flow>
</flows>

{% endhighlight %}
