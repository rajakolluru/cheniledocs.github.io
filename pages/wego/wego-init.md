---
title: "Initialization & Contexts in WeGO"
keywords: WeGO initialization commandcatalog
sidebar: wego_sidebar
toc: true
permalink: wego_init.html
folder: wego
summary: How is a WeGO service initialized? How is DI handled?
---

## The Approach

Initialization always happens during start up. All relevant strategies, commands etc. must be instantiated as singletons when the program starts up.

WeGO has a unique approach to initialization. WeGo modules must support dependency injection and 100% testabiity using any mocking strategy. 

WeGO does not prescribe any DI framework or container such as wire, dig etc. It instead uses a command catalog to maintain a catalog of initialized commands. This serves as a sort of application context.

The following guidelines are applicable for all WeGO modules: 

1. **No init() methods anywhere:** Very few exceptions apply to this rule. WeGO should not rely on initialization using init() methods. init() methods often get inextricably tied to global variables which considerably hinder testability. There are rare exceptions such as the _i18n_ and _config_ modules in WeGO. But these should be the exception rather than the rule.
2. **Make methods:** All WeGO services must be abstracted by interfaces. They all must support a make method that allows the creation of the service. The make method must return the interface and not the service type. *Make methods* also accept dependent interfaces. For example if a __UserService__ depends on the __UserRepo__ object, then the make method must accept the UserRepo object.
3. **Initializer:** Initializer is a method that is called to initialize all the commands in a module. Implementation of _Initializer_ is optional but strongly encouraged. It is typically present in the root package of a WEGO module. Look at the initializer in the WeGO library for an example. It must be possible to initialize a module by calling its initializer. Initializers abstract the complexity of instantiating multiple commands and injecting one command into another. The initializer takes away the complexity that might otherwise be forced to exist in a main() method. 
4. __Initializers__: A multi-module WeGO will need to initialize a bunch of Initializer types. Initializers is an array of Initializer. Since it is an array, the order of initialization is dictated by Initializers. Functions such as cmd.serve() accept Initializers. Each Initializer is called one after the other in the order specified. The main() is considered initialized only if all of the Initializer types have completed successfully.
5. The _mock_ tag: WeGO recommends a mock build tag. (see [Go Build Constraintt](https://golang.org/pkg/go/build/#hdr-Build_Constraints)). Tests that need to be executed using mocks can be executed using the mock build constraint like: 
```
go test -v --tags mock ./...
```
This ensures that go files are excluded if they have a build constraint like:
```
// +build !mock
```
This allows testing by mocking resources such as databases, nats servers etc.

##  Command Catalog
Command Catalog represents the "application context" which is a construct in other programming languages such as Java. However, the WeGO command catalog is extremely light. It serves as a container for commands.  

## WeGO Initializer

WeGO defines Initializer as:
```
type Initializer interface{
	Initialize(fw.CommandCatalog)(fw.CommandCatalog,error)
}
```
The purpose of __Initializer__ is to enhance the command catalog. Initializers accept a command catalog and send out a mutated version of the command catalog (with the new commands created by the initializer) .Not more than one Initializer is encouraged per module. If a module has multiple initializers, then they must be protected using the mock build constraint. See the example [below](#example).

## Go files in the root module
Every root WeGO module is encouraged to have two GO files. One is modulename-init.go and the other one is called initializers.go

### modulename-init.go
The module Initializer resides in modulename-init.go. It instantiates all the command exposed by the module. It also exposes the modules using convenience methods. Example WeGO initializer creates a ProxyService which is exposed using a convenience method like:
```
    wego.GetProxyService(commandCatalog fw.CommandCatalog)(wegohttp.ProxyService,error)
```

## initializers.go
This contains a slice of all the initializers that need to be called before the module could be initialized. There is a MakeInitializedCommandCatalog() method in WeGO framework that accepts an array of initializers and instantiates and enhances the Command catalog.

<a name='example'/>

## A Complete Example of Initialization
A module exposes a command interface FooService which is implemented by FooServiceImpl. 
FooServiceImpl requires an interface FooRepo. Since FooRepo requires a database, it is useful to mock it. Hence two implementations can exist for FooRepo namely DBFooRepo and MockFooRepo.
Each of these commands will have a make method. The whole code snippet in a package called "service" is shown below:

### The actual implementation code
```go
package service
type  FooService interface{
    Bar(context.Context, *SomeRequest)(SomeResponse,error)
}
type FooServiceImpl struct {
    fooRepo FooRepo
}
type FooRepo interface{}
type MockFooRepo struct{ 
    // mock the FooRepo implementation
} 
type DBFooRepo struct{
    // Provide the FooRepo implementation that connects to a DB
}
func MakeFooServiceImpl(fooRepo FooRepo)FooService{
    return FooServiceImpl {
        fooRepo: fooRepo,
    }
}
func MakeMockFooRepo(){
    return MockFooRepo{}
}
func MakeDBFooRepo(){
    return DBFooRepo{}
}
// Write implementations for FooServiceImpl, MockFooRepo and DBFooRepo
```

### Creating the Initializer
Now that we have defined the interfaces, implementations and the make functions, let us define foo-init.go
```go
import "service"
const (
    fooRepo = "FooRepo"
    fooService = "FooService"
)
type FooInitializer struct{}
func (FooInitializer) Initialize(cc fw.CommandCatalog)(fw.CommandCatalog,error){
    repo := initializeFooRepo()
    cc.RegisterCommand(fooRepo,repo)
    fs :=  service.MakeFooServiceImpl(repo)
    cc.RegisterCommand(fooService,fs)
}
func GetFooService(cc fw.CommandCatalog) FooService{
    return cc.Command(fooService).(FooService)
}
func GetFooRepo(cc fw.CommandCatalog) FooRepo{
    return cc.Command(fooRepo).(FooRepo)
}
```
In the code snippet above, we initialized FooServiceImpl and one of MockFooRepo or DBFooRepo. We have not yet specified which one is initialized since we took a rain check here with invoking initializeFooRepo() - a function that we have not yet created. 
initiailizeFooRepo() is a tricky function since it needs to create the mock or the actual one depending on whether we are in "mock" mode or not. We achieve this using a build constraint. 

### Creating the Conditional Initializer
The initializeFooRepo() is created in two files - both creating the same function!

mock-initializer.go
```go

// +build mock

// make sure that there are blank lines before and after the build directive and that it 
// occurs in the beginning of the file
func initializeFooRepo() FooRepo {
    return service.MakeMockFooRepo()
}
```

nonmock-initializer.go
```go

// +build !mock

// make sure that there are blank lines before and after the build directive and that it 
// occurs in the beginning of the file
func initializeFooRepo() FooRepo {
    return service.MakeDBFooRepo()
}
```
In this case, if the build tag mock is passed, then the mock foo repo is created. Else the DB one is created.

This is how we can seamlessly inject the mock implementation.






