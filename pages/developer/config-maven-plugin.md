---
layout: doc
title: Config Maven plugin
description: Generate the service-registry JSON description of a Chenile deployable at build time, during the integration-test phase.
permalink: /developer/config-maven-plugin/
---

# Config Maven plugin

`chenile-config-maven-plugin` (in `chenile-others`) generates the **service-registry JSON description** of a Chenile deployable **at build time**, so the ecosystem catalog can be produced from the actual, running application rather than hand-maintained.

## What it does

The plugin runs during the **integration-test phase**, in conjunction with the `spring-boot-maven-plugin`: it starts the application, reads its live Chenile service/operation definitions, and emits the JSON used to populate the (Aurora) service registry. You trigger it with a normal:

```shell
mvn verify
```

## Setup

Declare it in the `plugins` section of your `pom.xml`, alongside the Spring Boot plugin (which must expose the admin endpoint so the plugin can introspect the running app):

```xml
<plugin>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-maven-plugin</artifactId>
  <configuration>
    <jvmArguments>-Dspring.application.admin.enabled=true</jvmArguments>
  </configuration>
  <!-- start/stop executions bound to the integration-test phase -->
</plugin>

<plugin>
  <groupId>org.chenile</groupId>
  <artifactId>chenile-config-maven-plugin</artifactId>
  <!-- bind ConfigMojo to generate the registry JSON during verify -->
</plugin>
```

## Why generate at build time

Because the description is derived from the real application, it stays in sync with the code: new services, operations and parameters appear in the generated registry JSON automatically. That JSON feeds the [service registry](/concepts/09-registry-and-proxies/), so [proxies](/concepts/09-registry-and-proxies/) and the [Admin UI](/developer/admin-ui/) see an accurate, current catalog without manual upkeep.

<div class="callout"><div class="t">Where to look</div>
<code>org.chenile.config.plugin.ConfigMojo</code> in <code>chenile-others/chenile-config-maven-plugin</code>. It is the build-time counterpart to the runtime <a href="/concepts/09-registry-and-proxies/">service registry</a>.</div>
