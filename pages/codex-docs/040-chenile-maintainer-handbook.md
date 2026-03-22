---
title: Chenile Maintainer Handbook
keywords: chenile maintainer handbook release deploy tagging
tags: [chenile maintainer release deploy]
sidebar: codex_sidebar
permalink: /codex-chenile-maintainer-handbook.html
folder: codex-docs
summary: Practical workflow for Chenile maintainers covering version upgrades, installs, tagging, git describe checks, deploy, and Maven Central publication checks.
---

This handbook captures the practical maintenance workflow for the 11 primary Chenile repositories.

## Working rules

- Do not commit unrelated changes during a version upgrade.
- Prefer annotated tags so `git describe` resolves to the release tag.
- Treat `chenile-parent` as the release gate for all the other repositories.
- Do not deploy the sibling repositories until the new `chenile-parent` is visible in Maven Central.

## Repository order

Use this standard order for build, tagging, and deploy:

1. `chenile-parent`
2. `chenile-core`
3. `chenile-query-workflow-blueprints`
4. `chenile-service-registry`
5. `chenile-proxies`
6. `chenile-security`
7. `chenile-messaging`
8. `chenile-bdd`
9. `chenile-others`
10. `chenile-process-management`
11. `cconfig`

## Release checklist

### 1. Update versions

Update `chenile-parent` first, then update each sibling repository root `pom.xml` parent version and `*-version.txt` file.

### 2. Verify the scoped edits

Typical check:

```bash
git status --short
```

### 3. Run local installs

Run local build verification in repository order.

```bash
mvn install
```

The repository Makefiles also support:

```bash
make build
```

### 4. Commit the upgrade

Commit each repository with:

```text
Upgraded to <version>
```

### 5. Create annotated tags

```bash
git tag -a <version> -m "<version>"
```

### 6. Push branch and tag

```bash
git push
git push origin <version>
```

If `main` has no upstream:

```bash
git push --set-upstream origin main
git push origin <version>
```

### 7. Verify `git describe`

After tagging:

```bash
git describe
```

Expected result:

```text
<version>
```

If it returns something like `2.1.13-1-g<sha>`, the new tag is probably lightweight while the older tag is annotated.

Fix:

```bash
git tag -d <version>
git tag -a <version> -m "<version>"
git push --force origin refs/tags/<version>
```

## Deploy workflow

### Step 1: Deploy `chenile-parent`

```bash
make deploy
```

### Step 2: Wait for Maven Central

Verify that:

```text
org.chenile:chenile-parent:<version>
```

is visible in Maven Central before deploying any sibling repository.

### Step 3: Deploy the remaining repositories

Only after `chenile-parent` is visible in Maven Central, run:

```bash
make deploy
```

in the standard repository order.

## Troubleshooting

### `git describe` shows the previous version

Cause:
- the new tag is lightweight
- the older tag is annotated

Resolution:
- recreate the tag as annotated
- force-push the updated tag

### `chenile-parent` deploy succeeded but sibling deploys fail

Likely cause:
- Maven Central has not indexed the new parent yet

Resolution:
- wait until the parent version is visible in Maven Central
- retry dependent deploys after publication is confirmed
