---
title: Chenile 2.1.24 Release Notes
keywords: chenile 2.1.24 release notes release alignment documentation
tags: [chenile release notes documentation versioning]
sidebar: codex_sidebar
permalink: /codex-chenile-2-1-24-release-notes.html
folder: codex-docs
summary: Release notes for Chenile 2.1.24 covering release alignment, documentation refresh, and application parent upgrades.
---

Chenile `2.1.24` is the current published framework baseline for this workspace and documentation set.

## Highlights

### Release alignment

- The standard 11 Chenile repositories are aligned on `2.1.24`.
- `chenile-gen` now defaults generated projects to `2.1.24`.
- Application repositories that inherit directly from `chenile-parent` should also move to `2.1.24`.
- `chenile-javadoc` is aligned to the same parent release.

### Documentation refresh

The documentation set was updated to reflect:

- the `2.1.24` release baseline
- the refreshed sidebar versions across the docs site
- the current release baseline in the architecture and modules overview pages
- the current `chenile-gen` example dependency version

## Upgrade notes

- Applications that inherit from `org.chenile:chenile-parent` should use `2.1.24`.
- Generated or copied dependency examples should now prefer `2.1.24`.
- Older release notes remain available for historical context, but the active documentation baseline is now `2.1.24`.
