---
layout: doc
title: Releasing Chenile — the 11-repository release train
description: How a Chenile release is cut, tagged and published across the 11 repositories, gated on chenile-parent reaching Maven Central — plus the Javadoc and website follow-up.
permalink: /developer/release-process/
---

# Releasing Chenile — the 11-repository release train

Chenile ships as **one version across 11 repositories**, all inheriting from `chenile-parent`. This is the maintainer workflow for cutting a release. Contributors rarely need it; it documents how the version you depend on gets to Maven Central.

## Order

Always work in dependency order — for building, tagging and deploying:

1. `chenile-parent` · 2. `chenile-core` · 3. `chenile-query-workflow-blueprints` · 4. `chenile-service-registry` · 5. `chenile-proxies` · 6. `chenile-security` · 7. `chenile-messaging` · 8. `chenile-bdd` · 9. `chenile-others` · 10. `chenile-process-management` · 11. `cconfig`

## Rules

- **`chenile-parent` is the release gate.** No sibling is deployed until the new parent is *visible* on Maven Central — a successful deploy is not the same as an indexed artifact.
- **Annotated tags only.** `git describe` prefers annotated tags; a lightweight new tag next to an older annotated one makes a repository describe itself as `2.1.13-1-g<sha>`.
- **Scoped commits.** A version bump commits only the version changes — never sweep unrelated working-tree changes into a release.
- Shared documentation stays outside the code repositories.

## Checklist

```bash
# 1. versions: chenile-parent/pom.xml properties + chenile-version.txt;
#    then each sibling's parent version + its *-version.txt
git status --short                          # 2. only the intended changes
mvn install        # or: make build         # 3. in order, fix failures before moving on
git add pom.xml ./*-version.txt
git commit -m "Upgraded to <version>"       # 4.
git tag -a <version> -m "<version>"         # 5. annotated
git push && git push origin <version>       # 6. (--set-upstream origin main if needed)
git describe                                # 7. must print exactly <version>
```

A wrong tag is fixed with `git tag -d <version> && git tag -a <version> -m "<version>" && git push --force origin refs/tags/<version>`.

## Deploy

1. `make deploy` in `chenile-parent` (signing credentials come from the environment).
2. Wait until `org.chenile:chenile-parent:<version>` is downloadable from Maven Central.
3. `make deploy` in the other ten, in order. If a sibling fails to resolve the parent, Central hasn't indexed it yet — wait and retry.

Handy multi-repo checks:

```bash
for d in chenile-parent chenile-core chenile-query-workflow-blueprints chenile-service-registry chenile-proxies \
         chenile-security chenile-messaging chenile-bdd chenile-others chenile-process-management cconfig; do
  printf '[%s] ' "$d"; git -C "$HOME/Documents/framework/$d" describe
done
```

## After the framework

- **JGen and stm-cli have independent release versions.** When they adopt a new
  published Chenile parent, bump each tool's own patch version, rebuild and verify
  its distribution, and publish it with its own version tag. JGen 2.5.2 and stm-cli
  1.0.1 adopt Chenile 2.1.36. JGen's generation default also stays on published
  Chenile, even when framework development advances. Don't give the tools Chenile
  version tags. See [JGen releases](https://jgen.chenile.org/releases/).
- **Javadoc** — publish a released tag using `gh workflow run deploy-javadoc.yml -f version=<version>` in `chenile-javadoc`. Release-tag pushes also publish; development branch pushes do not. The working POM can follow the next version while the site continues to serve the last release.
- **This website** — `maven_version` in `_config.yml` drives every "latest release" string. A daily workflow (`scripts/update-version.sh`) follows Maven Central but **never downgrades**, so a work-in-progress version set by hand survives. Add release notes under `pages/release-notes/`, and refresh [Chenile by the numbers](/by-the-numbers/) with `python3 scripts/codebase-stats.py ..`.

## Release status: 2.1.36

Prepared on November 26, 2026. The framework release includes unified event triggers,
rebuilt schedules, MQTT event bindings, MCP calls through the Chenile pipeline, and
shared tenant discovery with pinned database routing for background work. See the
[2.1.36 release notes](/release-notes/2.1.36/) for migration steps.

All 11 repositories pass Maven builds and 877 framework tests, including all 17
PostgreSQL integration tests. Local release preparation signs the 73 publishing
modules and attaches source and Javadoc JARs. The test-only `cconfig-tests` module
is excluded from the Central bundle. The process console passes 10 unit tests,
four browser checks and its production build; the Javadoc aggregation builds.

**Maven Central publication is complete.** Post-release verification downloaded the
parent POM and checked all 259 POM, binary, source and Javadoc URLs for the 73
publishing modules; every URL returned HTTP 200. `cconfig-tests` is intentionally
excluded from publication.

The released API docs are published at [javadoc.chenile.org](https://javadoc.chenile.org/).
The Javadoc workflow publishes release tags; it no longer publishes development
branch pushes.

## Next development cycle: 2.1.37

The 11 framework working copies, Javadoc parent, process dashboard metadata and
this site's working version setting now follow `2.1.37`.
There is no `2.1.37` release tag and no deployment for that development version.
JGen 2.5.2 and stm-cli 1.0.1 build against released `2.1.36`; JGen also generates
`2.1.36` projects by default. Tool build parents and generation defaults do not
follow unpublished framework development versions.
