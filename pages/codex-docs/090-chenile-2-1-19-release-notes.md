---
title: Chenile 2.1.19 Release Notes
keywords: chenile 2.1.19 release notes build verification sidebars git describe
tags: [chenile release notes build verification sidebars git-describe]
sidebar: codex_sidebar
permalink: /codex-chenile-2-1-19-release-notes.html
folder: codex-docs
summary: Release notes for Chenile 2.1.19 covering repository synchronization, full build verification, release marker alignment, and documentation updates.
---

Chenile `2.1.19` rolls the framework family forward from `2.1.18` after pulling the latest remote state, rebuilding the full release set, and realigning the release markers, tags, and documentation around that version.

## Highlights

### Release and build verification

- The standard 11 Chenile repositories are aligned on `2.1.19`.
- `chenile-javadoc` is aligned to the same parent release.
- `chenile-gen` now defaults generated projects to `chenileVersion` `2.1.19`.
- A full `mvn install` run completed successfully for the release set:
  - `chenile-parent`
  - `chenile-core`
  - `chenile-query-workflow-blueprints`
  - `chenile-service-registry`
  - `chenile-proxies`
  - `chenile-security`
  - `chenile-messaging`
  - `chenile-bdd`
  - `chenile-others`
  - `chenile-process-management`
  - `cconfig`
  - `chenile-javadoc`

### Repository synchronization

- The release was prepared after syncing the Chenile repositories with `origin`, so the `2.1.19` bump sits on top of the latest pulled branch state rather than an older local snapshot.
- The version bump was then applied consistently across the standard release markers:
  - root `pom.xml`
  - repo-local `*-version.txt`
  - `chenile-parent` cross-repository version properties

### Documentation alignment

- The Codex docs set and the source maintenance docs are aligned to `2.1.19`.
- The main documentation sidebar, tutorial sidebar, developer sidebar, and Codex docs sidebar all now advertise `2.1.19`.
- The release notes sequence now includes a dedicated `2.1.19` page for the docs site.

## Upgrade notes

- The main Chenile repositories now resolve to `2.1.19` through `chenile-parent`.
- `git describe --tags` should return `2.1.19` across the standard tagged release repositories after the annotated tags are created and pushed.
- `chenile-gen` remains a release follow-up repository rather than part of the standard 11, but its default generator config should stay aligned with the current framework release.

## Documentation updates

The Chenile docs were updated to reflect:

- the `2.1.19` release alignment
- the new `2.1.19` release notes page
- the updated sidebar versions across the docs site
- the current release baseline in the architecture and modules overview pages
