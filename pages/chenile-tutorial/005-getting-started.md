---
title: Getting Started
keywords: chenile tutorial getting-started
sidebar: tutorial_sidebar
toc: true
permalink: app-gen-getting-started.html
folder: chenile-tutorial
summary: Getting started on Chenile code generator
---
# Repositories
* [Chenile Gen Repo](https://github.com/rajakolluru/chenile-gen)
* [Chenile Samples](https://github.com/rajakolluru/chenile-samples)

# Chenile app-gen
__app-gen__ is a Command Line Interface (CLI) that allows for generation of the basic scaffolding for a Chenile application. _app-gen_ has been developed in shell using mustache templates.

app-gen can be downloaded and run from (https://github.com/rajakolluru/chenile-gen). Use the app-gen folder. app-gen is already updated with the latest code in the bin folder. To build app-gen, do the following:
```bash
cd {chenile-folder}/app-gen
make # installs app-gen scripts into a bin folder. Installs mustache if required
cd bin
export PATH=$PATH:$PWD # this puts the bin folder in your path. You are all set.
```
# Chenile Samples
Chenile Samples_ provides you with a few folders that can be used to run the tutorials in this course. Chenile samples can also be used to jumpstart your projects by cloning the relevant folders. We will provide references to the relevant Chenile samples folder as we discuss each of the artifacts in this tutorial.

# A Chenile Service
Chenile services are structured using specific recommendations. They are Spring Boot Services that use the Chenile libraries to implement horizontal concerns. **chenile-parent** is the super pom that all service code depends on. A typical Chenile service code is made in two parts:
1. The Service itself
2. A mini monolith that hosts the service. The mini monolith can potentially host multiple services to save on deployment infrastructure. It is indeed recommended to decouple the service code from the deployment code so that each service does not mandate a new investment of infrastructure.

# Generating (or cloning) the Service and Mini Monolith
Chenile services can be generated using _app-gen_. Alternately, it is possible to clone the folders from chenile-samples. We will generate a service _s1_ that will be deployed in a monolith _m1_. You can directly download the service from the git path:
(https://github.com/rajakolluru/chenile-samples)

Copy the "s1" and "m1" folders from this to a separate folder. Alternately, you can use _auroragen_

## Using app-gen

If you have already installed app-gen and set it up in the PATH as described above, then type the following in a terminal. Your inputs for gen.sh are shown in double paranthesis():
```
$ cd # go to HOME folder
$ gen.sh 
1) Generate Normal Service & Mini Monolith
... Other options 
Please enter your choice: (or quit to exit the program) ((type 1 and enter))
Service Name:((type s1 and enter))
Service Version (0.0.1-SNAPSHOT): ((press enter))
Output Folder (./output):((press enter))
Creating service s1(0.0.1-SNAPSHOT) in folder ./output
Initialized empty Git repository in /Users/r0k02sw/output/s1/.git/
...
Successfully created a Git repo with your generated code. Next steps:
Connect to origin using the following command
Mini Monolith Name:((type m1 and enter))
Mini Monolith Version (0.0.1-SNAPSHOT): ((press enter))
Creating monolith m1(0.0.1-SNAPSHOT) with included service s1(0.0.1-SNAPSHOT) in folder ./output
...
Successfully created a Git repo with your generated code. Next steps:
Connect to origin using the following command
...
```
At the end of this, app-gen would have generated m1 and s1 folders in $HOME/output folder. 

Now, we will look at the m1 and s1 folders. 

## The Service classes
Service classes reside in two "jars" that are distributed as maven dependencies. For service s1, the jars will be typically called _s1-api_ and _s1-service_. _s1-api_ contains service model and interface whilst the _s1-service_ contains service implementations. The _s1-api_ jars can be distributed to any consumer of the service. _s1-service_ code must only be deployed in the monolith. No clients should use it since it contains implementation details.

The service files will be organized as follows:
```
.
├── Makefile
├── make.autocomplete
├── pom.xml
├── s1-api
│   ├── pom.xml
│   └── src
│       └── main
│           └── java
│               └── com
│                   └── yourcompany
│                       └── yourorg
│                           └── s1
│                               ├── model
│                               │   └── S1Entity.java
│                               └── service
│                                   └── S1Service.java
├── s1-service
│   ├── pom.xml
│   └── src
│       ├── main
│       │   ├── java
│       │   │   └── com
│       │   │       └── yourcompany
│       │   │           └── yourorg
│       │   │               └── s1
│       │   │                   ├── configuration
│       │   │                   │   ├── S1Configuration.java
│       │   │                   │   └── controller
│       │   │                   │       └── S1Controller.java
│       │   │                   └── service
│       │   │                       ├── healthcheck
│       │   │                       │   └── S1HealthChecker.java
│       │   │                       └── impl
│       │   │                           └── S1ServiceImpl.java
│       │   └── resources
│       └── test
│           ├── java
│           │   └── com
│           │       └── yourcompany
│           │           └── yourorg
│           │               └── s1
│           │                   ├── SpringTestConfig.java
│           │                   └── bdd
│           │                       ├── CukesRestTest.java
│           │                       └── CukesSteps.java
│           └── resources
│               ├── com
│               │   └── yourcompany
│               │       └── yourorg
│               │           └── s1
│               │               ├── TestService-chenile.properties
│               │               └── TestService.properties
│               ├── features
│               │   └── service.feature
│               └── version.txt
├── scripts
│   ├── curl-scripts.sh
│   ├── increment-tag.sh
│   ├── make-hotfix-branch.sh
│   └── merge-hotfix-to-master.sh


```

## The Mini Monolith
Mini monoliths can host multiple services. They include the service implementations as dependencies in the pom file. Mini monoliths also separate the configurations into its own folder. The actual packaged service will exist separately. For mini monolith m1, you will have _m1-configuration_ and _m1-package_. _m1-package_ contains the main class and its pom will depend on the _s1-service_ pom as mentioned above. The _m1-configuration_ will only contain configuration classes and no code. 

```
m1
├── Makefile
├── README.md
├── m1-configurations
│   ├── pom.xml
│   └── src
│       └── main
│           └── resources
│               ├── application.develop.properties
│               ├── application.unittest.properties
│               ├── chenile.properties
│               └── logback.xml
├── m1-package
│   ├── pom.xml
│   └── src
│       └── main
│           ├── java
│           │   └── com
│           │       └── yourcompany
│           │           └── yourorg
│           │               └── m1
│           │                   └── M1Application.java
│           └── resources
│               └── version.txt
├── make.autocomplete
├── pom.xml
└── scripts
    ├── curl-scripts.sh
    ├── increment-tag.sh
    ├── make-hotfix-branch.sh
    └── merge-hotfix-to-master.sh
```

# The Rationale of Separation
The structure shown above achieves a few things:
1. It separates developers from architects. Developers can write functional code. Architects configure horizontal requirements to the functional code and expose the code on various transports such as HTTP.
2. It de-couples development from deployment. The decision to bundle a bunch of services together is a deployment decision and must be taken when building the deployable mini monolith rather than when writing the service.  
3. Versioning of the service is independent of the versioning of the mini monolith. The mini monolith version 1.0 can for instance decide to bundle service1 version 1 and service2 version 2. 

# The Service & Mini Monolith Super POMs
 The generated code for both the service and mini monolith has a parent. The individual jars are modules under the super pom. The super pom has the parent pom as chenile-parent_. This standardizes a bunch of frameworks. Chenile Parent defines the BOM for other dependencies. Chenile parent ultimately inherits from spring-boot. Hence all the dependency management can start from spring and flows down. For example, for service s1 we can define the pom as follows:

```xml
<pom>
    <!-- Parent must be chenile-parent so that the correct bom gets inherited -->
    <parent>
        <groupId>org.chenile</groupId>
        <version>1.2.3</version>
        <artifactId>chenile-parent</artifactId>
    </parent>

    <properties>
        <s1.version>${revision}</s1.version>
    </properties>
    
    <groupId>com.wyourcompany.yourorg.s1</groupId>
    <!-- dont hard code the version in the pom. instead replace it when building the service -->
    <version>${revision}</version>
    <artifactId>s1-parent</artifactId>
    <name>..</name>
    <description>Modules execution project and Parent Pom</description>

</pom>
```
Thus the root pom acts as a super pom for all other modules of the service s1. It also is a module pom that executes the other modules when it is invoked. 
A similar structure is present in m1 as well. We will examine these in a much more detailed way in the next few chapters.




