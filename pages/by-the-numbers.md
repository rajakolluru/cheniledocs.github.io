---
title: "Chenile by the numbers"
kicker: "Code, tests &amp; documentation"
permalink: /by-the-numbers/
summary: "How much code, tests and documentation make up the 11 Chenile repositories — measured from the source, not estimated."
---
{% assign c = site.data.codebase %}{% assign t = c.totals %}
{% assign test_pct = t.test_loc | times: 100.0 | divided_by: t.main_loc | round %}
{% assign doc_words = c.site_words | plus: t.md_words %}

<p style="color:var(--muted);font-family:var(--mono);font-size:.85rem">Measured {{ c.measured }} from the working copies of the 11 repositories, including the in-progress <a href="{{ '/release-notes/2.1.31/' | relative_url }}">2.1.31</a> work.</p>

<div class="stats" style="margin:1.6em 0 2.4em">
  <div class="stat"><div class="num fmt" data-n="{{ t.main_loc }}">{{ t.main_loc }}</div><div class="lbl">Lines of production Java</div><div class="note">{{ t.main_files }} source files</div></div>
  <div class="stat"><div class="num fmt" data-n="{{ t.test_loc }}">{{ t.test_loc }}</div><div class="lbl">Lines of test Java</div><div class="note">{{ test_pct }} test lines per 100 production lines</div></div>
  <div class="stat"><div class="num">{{ t.modules }}</div><div class="lbl">Maven modules</div><div class="note">across 11 repositories, one release train</div></div>
  <div class="stat"><div class="num fmt" data-n="{{ doc_words }}">{{ doc_words }}</div><div class="lbl">Words of documentation</div><div class="note">site articles + repository guides</div></div>
</div>

## Code, repository by repository

Lines are **non-blank, non-comment** Java lines; Javadoc is counted separately. Tests are everything under `src/test`. Front-end lines cover the React consoles (Admin UI, process dashboard, PlantUML viewer).

<div class="table-scroll">
<table class="num-table">
  <thead><tr><th>Repository</th><th class="n">Modules</th><th class="n">Java files</th><th class="n">Production lines</th><th class="n">Test lines</th><th class="n">Javadoc lines</th><th class="n">Gherkin features</th><th class="n">Front-end lines</th><th class="n">Commits</th></tr></thead>
  <tbody>
  {% for r in c.repos %}
    <tr><td><code>{{ r.name }}</code></td><td class="n">{{ r.modules }}</td><td class="n fmt" data-n="{{ r.main_files | plus: r.test_files }}">{{ r.main_files | plus: r.test_files }}</td><td class="n fmt" data-n="{{ r.main_loc }}">{{ r.main_loc }}</td><td class="n fmt" data-n="{{ r.test_loc }}">{{ r.test_loc }}</td><td class="n fmt" data-n="{{ r.javadoc }}">{{ r.javadoc }}</td><td class="n">{{ r.features }}</td><td class="n fmt" data-n="{{ r.frontend_loc }}">{{ r.frontend_loc }}</td><td class="n">{{ r.commits }}</td></tr>
  {% endfor %}
    <tr class="total"><td>All 11 repositories</td><td class="n">{{ t.modules }}</td><td class="n fmt" data-n="{{ t.main_files | plus: t.test_files }}">{{ t.main_files | plus: t.test_files }}</td><td class="n fmt" data-n="{{ t.main_loc }}">{{ t.main_loc }}</td><td class="n fmt" data-n="{{ t.test_loc }}">{{ t.test_loc }}</td><td class="n fmt" data-n="{{ t.javadoc }}">{{ t.javadoc }}</td><td class="n">{{ t.features }}</td><td class="n fmt" data-n="{{ t.frontend_loc }}">{{ t.frontend_loc }}</td><td class="n">{{ t.commits }}</td></tr>
  </tbody>
</table>
</div>

Alongside the Java there are **{{ t.config_files }}** configuration and schema files (XML, JSON, YAML, properties, SQL — state machines, query metadata, process definitions, migrations) and **{{ t.feature_lines }}** lines of Gherkin across {{ t.features }} feature files.

<div class="callout key"><div class="t">Where the weight sits</div>
<code>chenile-core</code> — the exchange, the interception pipeline, HTTP binding, the state machine and workflow runtime, Owiz, MCP and the Admin UI — holds roughly two-fifths of the production code. The application blueprints (<code>chenile-query-workflow-blueprints</code>, <code>chenile-process-management</code>) are next; the integration repositories (security, messaging, registry, proxies) are deliberately small, because they plug into the same pipeline rather than re-implementing it. <code>chenile-parent</code> is a build baseline with no Java.</div>

### Tooling outside the release train

{% for r in c.tooling %}
<code>{{ r.name }}</code> (JGen) adds <span class="fmt" data-n="{{ r.main_loc }}">{{ r.main_loc }}</span> production and <span class="fmt" data-n="{{ r.test_loc }}">{{ r.test_loc }}</span> test Java lines in {{ r.modules }} Maven modules, plus <strong>{{ r.templates }}</strong> Mustache templates that make up its 12 built-in blueprints — see the [blueprint reference]({{ '/developer/jgen-blueprints/' | relative_url }}).
{% endfor %}

## Documentation

<div class="table-scroll">
<table class="num-table">
  <thead><tr><th>Source</th><th class="n">Pages / files</th><th class="n">Words</th></tr></thead>
  <tbody>
  {% for d in c.docs %}
    <tr><td>chenile.org — {{ d.label }}</td><td class="n">{{ d.pages }}</td><td class="n fmt" data-n="{{ d.words }}">{{ d.words }}</td></tr>
  {% endfor %}
    <tr><td>Repository guides &amp; READMEs (Markdown in the 11 repos)</td><td class="n">{{ t.md_files }}</td><td class="n fmt" data-n="{{ t.md_words }}">{{ t.md_words }}</td></tr>
    <tr class="total"><td>Total written documentation</td><td class="n">{{ c.site_pages | plus: t.md_files }}</td><td class="n fmt" data-n="{{ doc_words }}">{{ doc_words }}</td></tr>
  </tbody>
</table>
</div>

On top of the prose:

- **<span class="fmt" data-n="{{ t.javadoc }}">{{ t.javadoc }}</span> lines of Javadoc** in the source, published as API reference.
- **{{ t.features }} executable Gherkin specifications** — documentation that is also a test (see [BDD]({{ '/concepts/06-bdd-testing/' | relative_url }})).
- **The [video series]({{ '/video-series/' | relative_url }})** — 12 narrated episodes, about 21 minutes in total, with captions and full scripts on each episode page.
- **Interactive explainers** on the concept pages, and generated workflow diagrams from every state machine.

## How these numbers are produced

The figures come from `scripts/codebase-stats.py` in this site's repository, which walks the 11 repository checkouts and writes `_data/codebase.yml`; this page renders that file. Build output (`target`, `dist`, `node_modules`), shared site styling and IDE folders are ignored. To refresh after a release:

```sh
cd cheniledocs.github.io
python3 scripts/codebase-stats.py ..     # path to the folder holding the 11 repos
```

<script>
  document.querySelectorAll('.fmt').forEach(function (el) {
    var n = Number(el.getAttribute('data-n'));
    if (!isNaN(n)) el.textContent = n.toLocaleString('en-US');
  });
</script>
