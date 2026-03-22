---
title: Chenile Gen Getting Started
keywords: chenile gen jgen blueprint code generation
tags: [chenile user-guide app-gen code-generation]
sidebar: codex_sidebar
permalink: /codex-chenile-gen-getting-started.html
folder: codex-docs
summary: End user guide for developers using Chenile Gen and jgen for blueprint-based code generation.
---

This guide is for application developers who want to use Chenile and Chenile Gen to create services from standard blueprints instead of hand-building every module from scratch.

## What Chenile Gen Is

Chenile Gen lives in the neighboring `chenile-gen` repository. Its `jgen` tool generates Chenile application skeletons from blueprint plugins.

At a high level:

1. choose a blueprint
2. provide input values
3. Chenile Gen copies a template tree
4. it fills in names, packages, options, and conditional modules
5. the generated project compiles against the standard Chenile runtime libraries

## Main blueprints

The built-in blueprints include:

- `chenile-service`
- `wfservice`
- `wfcustom`
- `mybatisQuery`
- `chenile-interceptor`
- `it`
- `batch`
- `minimonolith`
- `jgen-blueprint`

For blueprint-based Chenile application generation, the most important ones are:

- `chenile-service`
- `wfservice`
- `wfcustom`
- `mybatisQuery`

## How the generated code uses Chenile

Examples:

- `mybatisQuery` generates a project that depends on `org.chenile:chenile-query-controller`
- `wfservice` and `wfcustom` generate projects that depend on `workflow-api` and `workflow-service`
- generated workflow builds also use `stm-generate-puml` for workflow diagrams

## Prerequisites

Before using Chenile Gen, make sure you have:

- Java installed
- Maven installed
- a shell environment such as `zsh`, `bash`, or PowerShell

If you are building Chenile Gen from source:

```bash
cd ~/Documents/framework/chenile-gen
make all
source setpath.sh
```

## The CLI entry point

```bash
chenile-gen/jgen/jgen-cli/bin/jgen.sh
```

## Two ways to generate

### Interactive mode

```bash
chenile-gen/jgen/jgen-cli/bin/jgen.sh
```

This starts a menu-driven prompt flow.

### Input-file mode

This is the safer and more repeatable mode.

Generate a sample input file:

```bash
chenile-gen/jgen/jgen-cli/bin/jgen.sh -g wfservice -o wfservice-input.json
```

Then run generation:

```bash
chenile-gen/jgen/jgen-cli/bin/jgen.sh -f wfservice-input.json
```

## Recommended workflow

1. Choose the right blueprint.
2. Generate a sample input file with `-g`.
3. Edit the JSON file.
4. Run generation with `-f`.
5. Inspect the generated project.
6. Build it with:

```bash
mvn install
```

## Blueprint selection guide

### `chenile-service`

Use this for a general Chenile service.

### `wfservice`

Use this when the domain entity moves through states and events and you want a generated workflow-enabled service.

### `wfcustom`

Use this when you already have workflow XML and want generation to derive wiring and support code from it.

### `mybatisQuery`

Use this when you need query endpoints backed by metadata JSON and MyBatis XML.
