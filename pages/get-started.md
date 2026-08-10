---
title: "Get started"
kicker: "Quickstart"
permalink: /get-started/
summary: "Generate an api + service pair, build a deployable monolith, and start attaching policies. Under ten minutes on a machine with Node, Make and Maven."
---

## What you'll need

- **Node** — the generator uses Mustache (downloaded automatically).
- **GNU/UNIX `make`** — to build the generator the first time.
- **Maven (`mvn`)** — to build the generated service.
- A shell — `bash` or PowerShell.

## 1 · Set up the generator

```bash
mkdir code && cd code
git clone https://github.com/rajakolluru/chenile-gen.git
cd chenile-gen/app-gen
make                       # compiles the generator into ./bin, downloads Mustache
export PATH=$PATH:$(pwd)/bin
```

## 2 · Create your local config

```bash
cd            # run gen.sh from a stable folder such as $HOME
gen.sh        # choose "create a local config"
```

This creates a `config/` folder containing `setenv.sh`. Edit it to set your **company** and **org** (product) names — these drive the Java package structure of the code you generate.

## 3 · Generate a service and a deployable

```bash
cd
gen.sh        # choose "create a normal service and monolith"
# service name:   stringdemo
# monolith name:  stringdemodeploy
# accept the defaults for version and output folder (./output)
```

You now have two folders:

- **`stringdemo/`** — the service, split into `stringdemo-api` (definition) and `stringdemo-service` (implementation).
- **`stringdemodeploy/`** — a deployable **monolith** that hosts the service.

## 4 · Build

```bash
cd output/stringdemo       && make build   # builds the api + service libraries
cd ../stringdemodeploy     && make build   # builds the runnable deployable
```

## 5 · Where to go next

<div class="grid-2" style="margin-top:1.4em">
  <div class="card">
    <div class="ic">🧩</div>
    <h3>Understand the split</h3>
    <p>See exactly what lives in the <code>api</code> vs <code>service</code> module and why consumers only ever depend on the <code>api</code>.</p>
    <p style="margin-top:10px"><a href="/concepts/02-definition-vs-implementation/">Definition vs. implementation →</a></p>
  </div>
  <div class="card">
    <div class="ic">🛡️</div>
    <h3>Attach a policy</h3>
    <p>Add a cross-cutting concern as an interceptor and choose whether it runs at the gateway, the last mile, or both.</p>
    <p style="margin-top:10px"><a href="/concepts/05-how-chenile-helps/">How Chenile helps →</a></p>
  </div>
  <div class="card">
    <div class="ic">📚</div>
    <h3>Full documentation</h3>
    <p>Tutorials, developer guides and release notes for every module.</p>
    <p style="margin-top:10px"><a href="{{ site.docs_url }}">cheniledocs →</a></p>
  </div>
  <div class="card">
    <div class="ic">▶️</div>
    <h3>Watch the series</h3>
    <p>Prefer video? The same story, in short episodes with live demos.</p>
    <p style="margin-top:10px"><a href="/video-series/">The Chenile video series →</a></p>
  </div>
</div>

<div class="callout" style="margin-top:2em">
  <div class="t">Note</div>
  Command names and repository paths above follow the current Chenile tutorial. If your generated layout differs, check the <a href="{{ site.docs_url }}">documentation</a> for your version.
</div>
