---
title: Configuration
keywords: WeGO config
sidebar: wego_sidebar
toc: true
permalink: wego_config.html
folder: wego
summary: How does WeGO framework handle configuration properties. Where are they read from?
---
## The WEGO Configurations Framework
WeGO uses the [viper framework](https://github.com/spf13/viper) for configuration management.

<a href="#" data-toggle="tooltip" data-original-title="{{site.data.glossary.toml}}">TOML</a>  files will contain the configurations. They will be located in ${CONFIGPATH}/env/prod or dev or test or default folders. The _default_ folder is special. It contains the default configuration. The other folders contain the environment specific configuration. The environment is specified using the ENV environment variable.

All the TOML files contained in the folders are read during start up. Programs requiring configurations must use the config package to obtain the configuration. Sample below:
```go
import "github.com/agorago/wego/config"
...
property1 := config.Value("config_test.property1")
// the above will fetch the value of property1 in the namespace "config_test"
```

## Over-riding the Property
Over-riding the property can be accomplished by setting an environment variable with the same name in upper case. For example, to override the property1 in the example above, we will need to set a variable "CONFIG_TEST.PROPERTY1" in the environment before starting the application. 

Since most shells (in UNIX or DOS) do not support the "." in the variable name, it is possible to set up an environment variable "CONFIG_TEST__PROPERTY1" . Here __ is replaced with a dot. 