#!/usr/bin/env bash
# Update `maven_version` in _config.yml to the latest released Chenile version.
#
# Source of truth: the Maven Central metadata for org.chenile:chenile-parent.
# The whole site prints {{ site.maven_version }}, so bumping this one line
# updates every "latest release vX.Y.Z" on the site.
#
# Usage:
#   scripts/update-version.sh            # fetch latest from Maven Central and write it
#   scripts/update-version.sh 2.1.30     # set an explicit version
set -euo pipefail

GROUP_PATH="org/chenile"
ARTIFACT="chenile-parent"
META_URL="https://repo1.maven.org/maven2/${GROUP_PATH}/${ARTIFACT}/maven-metadata.xml"
CONFIG="$(dirname "$0")/../_config.yml"

if [[ "${1:-}" != "" ]]; then
  VERSION="$1"
else
  echo "Fetching latest ${ARTIFACT} version from Maven Central…"
  META="$(curl -fsSL "$META_URL" || true)"
  # prefer <release>, fall back to <latest>
  VERSION="$(printf '%s' "$META" | sed -n 's:.*<release>\(.*\)</release>.*:\1:p' | head -n1)"
  [[ -z "$VERSION" ]] && VERSION="$(printf '%s' "$META" | sed -n 's:.*<latest>\(.*\)</latest>.*:\1:p' | head -n1)"
fi

# sanity: must look like a version (e.g. 2.1.30)
if ! printf '%s' "$VERSION" | grep -Eq '^[0-9]+\.[0-9]+(\.[0-9]+)?'; then
  echo "Could not determine a valid version (got '${VERSION:-}'). Leaving _config.yml unchanged." >&2
  exit 0
fi

CURRENT="$(sed -n 's/^maven_version:[[:space:]]*"\{0,1\}\([^"]*\)"\{0,1\}[[:space:]]*$/\1/p' "$CONFIG")"
if [[ "$CURRENT" == "$VERSION" ]]; then
  echo "maven_version already at $VERSION — no change."
  exit 0
fi

# portable in-place edit (GNU or BSD sed)
tmp="$(mktemp)"
sed "s/^maven_version:.*/maven_version: \"${VERSION}\"/" "$CONFIG" > "$tmp" && mv "$tmp" "$CONFIG"
echo "maven_version: $CURRENT -> $VERSION"
