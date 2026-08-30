---
title: "Get started"
kicker: "Quickstart"
permalink: /get-started/
summary: "Scaffold a Chenile service with jgen, build a deployable mini-monolith, and start attaching policies — in about ten minutes with Java, Maven and git."
---

<div class="callout" style="margin-bottom:1.6em">
  <div class="t">Heads up — use <code>jgen</code>, not <code>app-gen</code></div>
  The older Node-based <code>app-gen</code> / <code>gen.sh</code> generator is <strong>deprecated</strong>. The current, supported generator is <strong>jgen</strong> — a pure-Java, blueprint-driven tool. Everything below uses jgen. See <a href="/concepts/12-jgen/">jgen in depth</a> and <a href="/concepts/15-blueprints/">writing blueprints</a>.
</div>

## What you'll need

- **Java 17+** — jgen and the generated services are Java/Spring Boot.
- **Maven (`mvn`)** — to build jgen and the generated project.
- **git** and a shell — `bash`, `zsh` or PowerShell.

(No Node required — jgen is a Java program.)

## 1 · Install jgen

```bash
git clone https://github.com/rajakolluru/chenile-gen.git
cd chenile-gen
make clean all            # builds jgen (and stm-cli) and the CLI wrapper scripts
source setpath.sh         # puts `jgen` and `stm-cli` on your PATH
```

`make all` builds the multi-module jgen project and prepares the launcher at `jgen/jgen-cli/bin/jgen.sh`. `source setpath.sh` adds that (and `stm-cli`) to your `PATH` for the session — add the same line to your `~/.zshrc` / `~/.bashrc` to make it permanent.

## 2 · (Optional) create a local config

jgen ships sensible defaults (package `com.mycompany.myorg`, version `0.0.1-SNAPSHOT`, output `./output`). To customise them for your company:

```bash
jgen -e                   # emits the default config into ./config
```

Edit `config/config.json` — set `company`, `org` and the Chenile version. jgen offers any file in `config/` as a choice at startup, and resolves placeholders like `${defaultVersion}` from it.

## 3 · Generate a service

Run jgen with no arguments for the interactive flow:

```bash
jgen
# 1) pick your config (or the bundled default)
# 2) choose the blueprint:  chenile-service
# 3) service name:          orders
#    accept the defaults for version (0.0.1-SNAPSHOT) and output (./output)
#    jpa: y   security: n   cloudSwitch: n   MCP: n
```

You now have **`output/orders/`** — the service, split into `orders-api` (the definition) and `orders-service` (the implementation).

> Prefer scripted/non-interactive generation? `jgen -g chenile-service -o orders.json` writes a sample input file showing exactly which fields the blueprint expects; edit it, then run `jgen -f orders.json`.

## 4 · Generate a mini-monolith to host it

A service module is a library — it's deployed by a **mini-monolith**. Generate one and add your service as a dependency:

```bash
jgen
# choose the blueprint:  minimonolith
# monolith name:         ordersdeploy
# add "orders" under the dependencies prompt (and enable H2 console / query controller if you like)
```

This produces **`output/ordersdeploy/`** — a runnable Spring Boot deployable that hosts one or more Chenile services.

## 5 · Build &amp; run

```bash
cd output/orders       && make build     # builds the api + service libraries (mvn install)
cd ../ordersdeploy     && make build     # builds the deployable
cd ../ordersdeploy     && make run       # starts it — call your endpoint with the scripts in scripts/
```

## More blueprints

`jgen` ships a blueprint for almost every kind of Chenile module — a workflow service, a MyBatis query, an interceptor, a batch job, integration tests, even a blueprint that generates blueprints. Explore them all:

<div class="grid-2" style="margin-top:1.4em">
  <div class="card">
    <div class="ic">🧬</div>
    <h3>jgen in depth</h3>
    <p>Every built-in blueprint, the interactive vs. file-driven flows, config and template mechanics — with a live blueprint picker.</p>
    <p style="margin-top:10px"><a href="/concepts/12-jgen/">jgen code generation →</a></p>
  </div>
  <div class="card">
    <div class="ic">📐</div>
    <h3>Write your own blueprint</h3>
    <p>The anatomy of a blueprint and how to scaffold a new one with the <code>jgen-blueprint</code> blueprint.</p>
    <p style="margin-top:10px"><a href="/concepts/15-blueprints/">Blueprints →</a></p>
  </div>
  <div class="card">
    <div class="ic">🧩</div>
    <h3>Understand the split</h3>
    <p>What lives in the <code>api</code> vs <code>service</code> module, and why consumers only ever depend on the <code>api</code>.</p>
    <p style="margin-top:10px"><a href="/concepts/02-definition-vs-implementation/">Definition vs. implementation →</a></p>
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
  Chenile artifacts are on Maven Central, so generated projects build without compiling the framework from source. If a prompt or generated path differs on your version, run <code>jgen -g &lt;blueprint&gt;</code> to see that blueprint's exact fields.
</div>
