---
title: "Blueprints: author your own generator"
short: "Writing blueprints"
order: 15
summary: "A jgen blueprint is a small plugin — a JSON contract, an optional Java hook, and a template tree. Learn its anatomy and scaffold a brand-new blueprint with the jgen-blueprint blueprint (yes, really)."
---

## Blueprints are the unit of reuse

[jgen](/concepts/12-jgen/) generates projects from **blueprints**, and the blueprints are not magic — each is a tiny, self-describing plugin you can read, copy and write yourself. Encoding a team's conventions as a blueprint means every new service, query or interceptor starts *correct*: right structure, right dependencies, tests and diagrams already in place.

This chapter is the authoring guide: what a blueprint is made of, and how to create a new one.

## Anatomy of a blueprint

Every blueprint lives in a `bp-<name>` Maven module with three parts:

<div class="jsx-flow2" style="display:flex;gap:10px;flex-wrap:wrap;align-items:stretch;margin:1.4em 0">
  <div class="card" style="flex:1 1 200px"><div class="ic">📄</div><h3>1 · <code>blueprint.json</code></h3><p>The declarative contract: name, description, the input fields to prompt for, the template folder, and an optional init hook. Lives at <code>src/main/resources/META-INF/blueprint.json</code>.</p></div>
  <div class="card" style="flex:1 1 200px"><div class="ic">🧠</div><h3>2 · Init hook <span style="color:var(--muted);font-weight:600">(optional)</span></h3><p>A Java class implementing <code>InitHook</code> that computes extra template variables — capitalized names, or data parsed from an input file.</p></div>
  <div class="card" style="flex:1 1 200px"><div class="ic">🌳</div><h3>3 · Template tree</h3><p>A real directory of Mustache templates. Placeholder names in files <em>and</em> folders get substituted; conditional folders/sections switch modules on and off.</p></div>
</div>

jgen discovers blueprints by scanning the classpath for every `META-INF/blueprint.json`, so dropping a `bp-*` jar on the classpath registers a new blueprint automatically.

## 1 · The JSON contract

```json
{
  "name": "chenile-service",
  "description": "Generates a Chenile Service",
  "templateFolder": "service-template",
  "initHook": "org.chenile.jgen.blueprint.service.InitServiceBlueprint",
  "inputFields": [
    { "name": "service", "type": "STRING",  "description": "Name of Service", "defaultValue": "${defaultServiceName}" },
    { "name": "jpa",     "type": "BOOLEAN", "description": "Enable JPA",       "defaultValue": "y" },
    { "name": "security","type": "BOOLEAN", "description": "Enable Security",  "defaultValue": "n" }
  ]
}
```

- **`inputFields`** drive the interactive prompts and the sample file that `jgen -g <name>` emits. Types are `STRING`, `BOOLEAN` (entered as `y`/`n`, normalized to `"true"` when enabled), and `FILE` (must point to an existing file).
- **`defaultValue`** may reference config placeholders like `${defaultServiceName}` or `${defaultVersion}`, resolved from the chosen config before prompting.
- **`templateFolder`** names the template directory under `src/main/resources`.
- **`initHook`** is the fully-qualified class name of an optional hook.

## 2 · The init hook

The JSON is declarative; the hook is imperative. It implements `InitHook` and configures a `BlueprintConfig` — most commonly by setting a **`postInputCaptureHook`** that derives extra variables after the user's answers are captured:

```java
public class InitServiceBlueprint implements InitHook {
  @Override
  public void init(BlueprintConfig cfg) {
    cfg.postInputCaptureHook = (Map<String,Object> map) -> {
      String service = (String) map.get("service");
      map.put("Service", CapUtils.capitalizeFirst(service));  // now templates can use {{Service}}
    };
  }
}
```

`BlueprintConfig` also exposes a `postProcessHook` (run after files are generated) and the blueprint's `name`, `description`, `templateFolder` and `inputFields`. Simple blueprints just capitalize a name; advanced ones do real work — **`bp-wfcustom`** parses a workflow STM XML file and injects state/transition and test-case data into the map; **`bp-batch`** reads a batch-definition JSON and computes parent/child process metadata — all before a single template is rendered.

## 3 · The template tree

The template folder is an ordinary directory that jgen copies and renders:

```text
service-template/
└── __service__/                     ← folder name is a placeholder
    ├── Makefile.mustache            ← ".mustache" files are rendered
    ├── pom.xml.mustache
    ├── __service__-api/ …           ← nested placeholders
    └── __service__-service/ …
```

Three rules cover almost everything:

- **Placeholder paths** — `__service__`, `__com__`, `__company__`, `__org__` in file and folder names are replaced with the resolved values, so packages and module names come out right.
- **`.mustache` contents** — any `{{variable}}` inside a `.mustache` file is substituted; the `.mustache` suffix is dropped on output.
- **Conditionals** — `{{#security}}…{{/security}}` / `{{#jpa}}…{{/jpa}}` toggle blocks of content, and marker folders such as `%%gitInit=true%%` toggle whole subtrees and post-actions (like initializing a git repo).

## Write a new blueprint — with a blueprint

The fastest way to author one is the recursive **`jgen-blueprint`** blueprint, which scaffolds a complete `bp-*` module for you:

```bash
jgen
# choose:  jgen-blueprint
# blueprintName:  awesomething
```

That generates `bp-awesomething/` with a ready `blueprint.json`, an `InitAwesomethingBlueprint` hook, and a starter template folder. From there:

<div class="callout key">
  <div class="t">Four steps to a working blueprint</div>
  <strong>1.</strong> Edit <code>blueprint.json</code> — declare your <code>inputFields</code> and description.
  <strong>2.</strong> Build your template tree — add files, use <code>__placeholders__</code> in paths and <code>{{vars}}</code> / <code>{{#flags}}</code> inside <code>.mustache</code> files.
  <strong>3.</strong> (Optional) enrich the map in your <code>InitHook</code> — derive names or parse an input <code>FILE</code>.
  <strong>4.</strong> Build the module and put its jar on jgen's classpath — it now appears in the menu and via <code>jgen -g awesomething</code>.
</div>

## Why author blueprints

<div class="split" style="margin-top:1.4em">
  <div class="panel good">
    <h3>✅ Payoff</h3>
    <ul>
      <li>Encode <em>your</em> conventions once; every new module inherits them</li>
      <li>New services start with tests, diagrams and the right dependencies</li>
      <li>Onboarding shrinks — "run jgen, pick the blueprint"</li>
      <li>Blueprints are versioned and shared like any other artifact</li>
    </ul>
  </div>
  <div class="panel">
    <h3>🧰 The built-ins to learn from</h3>
    <ul>
      <li><code>bp-service</code> — the minimal pattern (capitalize a name)</li>
      <li><code>bp-mybatisQuery</code> — a query module contract</li>
      <li><code>bp-wfcustom</code> — parses an XML file in its hook</li>
      <li><code>bp-jgen-blueprint</code> — a blueprint that writes blueprints</li>
    </ul>
  </div>
</div>

<div class="callout"><div class="t">Where to look</div>
Engine &amp; model: <code>jgen-base</code> (<code>BlueprintConfig</code>, <code>InitHook</code>, the classpath registry and file pipeline). CLI: <code>jgen-cli</code> (<code>GenMain</code>, <code>InputCapture</code>). Blueprints: the <code>bp-*</code> modules in <code>chenile-gen/jgen</code>. Emit a sample input for any blueprint with <code>jgen -g &lt;name&gt; -o input.json</code>.</div>
