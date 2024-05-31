---
title: Chenile MQ-TT
keywords: chenile  mqtt
sidebar: chenile_sidebar
toc: true
permalink: /chenile-mqtt.html
folder: chenile
summary: Support for MQ-TT as a transport protocol for Chenile services and operations
---

Chenile MQTT uses the MQ-TT protocol to trigger interactions with Chenile Services. Chenile MQTT currently supports Asynch interactions i.e. MQ-TT can trigger specific services without the result being used by the caller. It is recommended that we use HTTP for synchronous interactions. 

## Configuring Chenile MQTT
There are a few steps to configure Chenile MQTT. 
1. Set up an MQ-TT broker. Include chenile-mqtt as a dependency.
2. Configure certain properties that allow Chenile MQTT to connect to the broker.
3. Declare individual services as triggerable via MQ-TT. 
4. Publish messages to MQ-TT.
5. Most importantly, write unit tests that prove that this entire interaction works!

## Setting up an MQ-TT broker
Chenile uses the MQTT5 protocol to communicate with the broker. Hence, any broker such as EMQX, Hive, Azure IoT Hub etc. are suitable for Chenile MQ-TT. It is preferable to use a managed service to maintain the broker. Most commercial offerings provide for managed services.

To include, chenile-mqtt as a dependency, use the following in maven:
```xml
<dependency>
    <groupId>org.chenile</groupId>
    <artifactId>chenile-mqtt</artifactId>
</dependency>
```

## Configure Chenile MQTT Properties
Chenile MQTT uses certain application.yml properties to communicate with the broker. Chenile uses Eclipse paho as the MQ-TT client. Hence most of these properties belong to the client and can be read from the client documentation [here](https://eclipse.dev/paho/index.php?page=clients/java/index.php). Hive MQ provides comprehensive MQ-TT tutorials that describe these properties in great detail. 
Here is a table that describes these properties along with some references to the HiveMQ documentation. 

### General properties
All properities are prefixed with "mqtt."

|Property name| Recommended Values| What does it do?| 
|-------------|--------------|-----------------|
|clientID||The client ID of the connection. Cloud will have its own Client ID whilst each edge will have its unique client ID|
|actionTimeout|12000|How much time (in milliseconds) to wait before an action such as publishing a message to a topic times out|
|enabled|true|If true, all the services will be subscribed to MQ-TT broker. If false, none of the services will be triggered. Remember that Chenile MQTT will connect to the broker even if this property is set to false|

### Connection Properties
All the properties below are prefixed with 'mqtt.connection". 

|Property name| Recommended Values| What does it do?| 
|-------------|--------------|-----------------|
|ServerURIs||MQ-TT broker URL(s). We can use multiple of them.|
|keepAliveInterval||See [keep alive](https://www.hivemq.com/blog/mqtt-essentials-part-10-alive-client-take-over/)|
|userName,password||The user name and password. This is getting better optimized to avoid plain text credentials|
|cleanStart|false|This must be set to false to ensure that connections are reliable. See [here](https://www.hivemq.com/blog/mqtt-essentials-part-7-persistent-session-queuing-messages/)|
|receiveMaximum|1000|How many messages can be received in the buffer?|
|automaticReconnect|true|Should we automatically try reconnecting if the connection fails?|
|session.expiry||Read more on MQ-TT sessions [here](https://www.hivemq.com/blog/mqtt5-essentials-part4-session-and-message-expiry/).|

### MQTT Publish Properties
The properties below are used as defaults for publishing messages into MQ-TT. Remember that these properties are over-ridden based on individual services. Individual services can define their own properties. See section on [declaring individual services](#declare-individual-services-as-triggerable-via-chenile-mqtt)
All the properties are prepended with "mqtt.publish."

|Property name| Recommended Values| What does it do?| 
|-------------|--------------|-----------------|
|actionTimeout|12000|The timeout (in milliseconds) to wait for the message to be sent|
|qos|2|The default Quality of service for all messages. This will be over-ridden at the service level|
|retain|false|Is the message a retained message? Read more about this [here](https://www.hivemq.com/blog/mqtt-essentials-part-8-retained-messages/)|
|base.topic|chenile|this can be a constant or can contain an expression such as c/{x-chenile-tenant-id} for tenant specific topics. Read about it [here](/mqtt-multi-tenancy.html).Make sure that the values given in mqtt.subscribe.base.topic are compatible with this one.|

### MQTT Subscribe Properties
The properties below specify subscription properties. "mqtt.subscribe." is the prefix.

|Property name| Recommended Values| What does it do?| 
|-------------|--------------|-----------------|
|base.topic|chenile|this varies depending on the deployment. In a multi-tenant SaaS environment, for cloud deployment it can be c/+ since the cloud subscribes to all the tenants. Since edges are specific to tenants this can have values such as c/t1. Read about it [here](/mqtt-multi-tenancy.html). Make sure that the values given in mqtt.publish.base.topic are compatible with this one.|


### Last Will & Testament
MQ-TT supports the notion of last will and testament which you can read about [here](https://www.hivemq.com/blog/mqtt-essentials-part-9-last-will-and-testament/).
The following properties allow Chenile to configure these. These belong to the MQ client and are best read with MQ-TT documentation. All properties are prefixed with "mqtt.will"

|Property name| Recommended Values| What does it do?| 
|-------------|--------------|-----------------|
|payload||The payload of the last will message|
|qos||The qos of the last will message. |
|retained||Is the last will message retained? Read about message retention [here](https://www.hivemq.com/blog/mqtt-essentials-part-8-retained-messages/)|
|topic||The topic at which the last will message will be published.|

## Declare Individual Services as Triggerable via Chenile MQTT
This is a surprisingly simple thing to do. We need to merely annotate the controller of the service with @ChenileMqtt. This is done at the service (and not at the operation) level. This annotation makes sure that this service is subscribed to a topic with a particular QoS. Recommended qos level is 2. (the same as mqtt.publish.qos) 

You can also use a lesser qos for non-critical read-only services. The publish and subscribe topics are not recommended to be tweaked at a service level. Instead, it is best to leave them at the default values. For publishTopic the default value is computed as {mqtt.publish.base.topic}/{service name}/ {operation name}. For subscribeTopic it would be {mqtt.subscribe.base.topic}/{service name}/ {operation name}.

In most cases, an empty @ChenileMqtt will do the trick!

## Publishing messages to Mqtt
The MqttPublisher that ships with chenile-mqtt can be @Autowired into your class for publishing purposes. It exposes three methods:

```java
public void publishToOperation(String service, String operationName,
	String payload,Map<String,Object> properties) throws Exception;
public void publish(String topic,  String payload, Map<String,Object> properties)
            throws MqttPersistenceException, MqttException ;
public void publish(String topic, int givenQos, String payload, Map<String,Object> properties)
            throws MqttPersistenceException, MqttException ;
 
```

Use publishToOperation() if you want to publish a message to a specific Chenile service and operation. The configuration parameters for the service are used to compute the topic and qos. 

Use the other forms of the signature to publish to specific topics and specific qos. Read Javadocs for more information.

## Unit Testing
This is a separate topic in itself and will be covered in detail in a separate article.
