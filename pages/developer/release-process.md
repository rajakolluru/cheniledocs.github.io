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

- **JGen** (`chenile-gen`) and its STM CLI are released separately and should be aligned to the new parent.
- **Javadoc** — bump the parent in `chenile-javadoc/pom.xml`; building the aggregation POM does not publish the Javadoc site by itself.
- **This website** — `maven_version` in `_config.yml` drives every "latest release" string. A daily workflow (`scripts/update-version.sh`) follows Maven Central but **never downgrades**, so a work-in-progress version set by hand survives. Add release notes under `pages/release-notes/`, and refresh [Chenile by the numbers](/by-the-numbers/) with `python3 scripts/codebase-stats.py ..`.

## Release status: 2.1.31

As of October 3, 2026 every framework repository builds and passes its tests against `2.1.31` (791 framework tests, plus 22 in JGen, with zero failures), annotated tags mark the verified commits, and **`org.chenile:chenile-parent:2.1.31` is published on Maven Central**. Deployment of the remaining ten repositories, JGen and the Javadoc site follows in the order above. See the [2.1.31 release notes](/release-notes/2.1.31/).
