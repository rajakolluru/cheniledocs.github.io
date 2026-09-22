---
layout: doc
docs_section: release-notes
title: Release notes
description: Per-version notes across recent Chenile releases. The 11 repositories move together under chenile-parent on one version.
permalink: /release-notes/
---

# Release notes

Chenile's repositories are versioned together under `chenile-parent` and released on one train, so a single version number moves the whole framework forward. The current framework version is **v{{ site.maven_version }}** (also shown in the footer). Some releases may be work-in-progress and not yet on Maven Central.

## By version

- [**2.1.31**]({{ '/release-notes/2.1.31/' | relative_url }}) — *(work in progress)* transport-neutral services, service-registry controls, JGen compatibility, and Spring MVC mapping simplification.
- [**2.1.30**]({{ '/release-notes/2.1.30/' | relative_url }}) — numeric JPA id support; release-train alignment.
- [**2.1.29**]({{ '/release-notes/2.1.29/' | relative_url }}) — release alignment across the 11 repositories and documentation refresh.

For the complete, authoritative history — every tag and its diff, including 2.1.17–2.1.28 — see the GitHub releases:

- [chenile-core releases](https://github.com/ajapros/chenile-core/releases)
- [all Chenile repositories](https://github.com/ajapros)

<div class="callout"><div class="t">How the version is maintained</div>
The version shown across the site comes from one place (<code>maven_version</code> in <code>_config.yml</code>). A scheduled job bumps it <em>forward</em> to the newest published <code>chenile-parent</code> on Maven Central, and never downgrades — so a hand-set, work-in-progress version stays put until the release actually ships.</div>
