---
title: WeGO - Approah to Error Handling
keywords: WeGO error exceptions
sidebar: wego_sidebar
toc: true
permalink: wego_error_handling.html
folder: wego
summary: The approach to error handling. How are errors generated and passed around?
---
## The Approach
GO Lang relies on errors. It is idiomatic and encouraged to return sensible actionable errors. 

To make errors useful, WeGO stipulates the following approach towards generating errors:
1. Avoid Panics. Instead send sensible information in the error struct.
2. Errors must have a numeric error code. Numeric Error codes can be checked and the caller can make choices on how to deal with them. 
3. Ensure that the error codes are in different ranges for different services. By looking at the error code range, it is possible to diagnose which service is responsible to generate the error.
4. Generate a helpful HTTP error code if possible. The error handling package defines an interface __HttpCodeProvider__ that emits the HTTP error code. It is recommended that error implementations at least implement this interface methods. The WeGO http package looks for this interface and returns the appropriate HTTP error.
5. Construct internationalized error messages. Each error code must correspond to an error message which is obtainable from an i18n message bundle. The error message can have place holders for inserting variables. These variables are passed in at the time of creating the error.
6. The _error_ interface defines a method called Error() that is the string representation of the error message. The string returned by WeGO error is a JSON. This allows the HTTP proxy to reconstruct the error even on the client side. 
7. Error must also store an array of errors to ensure traceability. 
8. Error must also contain enough information about the context. Hence the WeGOError generator accepts a ctx as the first parameter so it can extract the requisite information from ctx.
9. Support for warnings and errors. A warning can return valid values and a warning message.

## Typical usage
Services must use a designated error code range for returning errors. Each error code will have a name and a numeric value. For example _FileNotFound_ may have an error code value of _2000_. This is defined using an iota range. Check out the WeGO error ranges defined [here](github.com/agorago/wego/internal/err/blob/master/codes.go)

Each error code must be mapped to a i18n message defined in a resource bundle. So we should define a resource bundle value for key "<service name>.FileNotFound". The service name prefix is important to avoid name collission between services.

## Steps to create service specific error code
Let us say we want to create a new error code "FileNotFound" for service "foo". Let us say we have chosen the range 2000-2200 to represent errors for this service.
1. Go to folder fooservice/internal/err. Create a codes.go file (This is automatically generated using wego gen)
2. Provide error enums. 
```go
    type WeGOErrorCodes int
    const  {
        FileNotFound WeGOErrorCode = iota + 2000  // foo.FileNotFound
    }
    //go:generate stringer -linecomment -type=WeGOErrorCode
```
3. Use go generate to generate a file that translates the enums to corresponding "strings". Eg: an enum called FileNotFound must be translated to the string called "foo.FileNotFound". The stringer command with go generate allows the generation of this translation. This command is automatically inserted into the Makefile by wego-gen. The linecomment at the end of the file makes sure that the translation is generated  by stringer. Run stringer by doing the following:
```
$ go get golang.org/x/tools/cmd/stringer # download stringer
$ go generate internal/err/codes.go # run the go generate 
```

4. Write the corresponding detailed error message in the i18n bundle toml file under configs/bundles/en-US folder.
```
[foo]
FileNotFound = "File {{.Filename}} not found"
```
Notice the place holder Filename inserted above. Also notice that it starts with a "."
5. To create the error in code use:
```go
import fooerr "github.com/.../fooservice/internal/err"
...
err := fooerr. MakeWeGOHTTPError(ctx, http.StatusBadRequest, fooerr.FileNotFound, map[string]interface{}{
			"Filename": filename}
```
Notice how the place holder "Filename" is passed when creating the error.




