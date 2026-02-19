#!/usr/bin/env bash
# Install Reggie git hooks into .git/hooks/
# Run this once after cloning or whenever hooks are updated.

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
HOOKS_SRC="$REPO_ROOT/scripts/hooks"
HOOKS_DEST="$REPO_ROOT/.git/hooks"

for hook in "$HOOKS_SRC"/*; do
  name=$(basename "$hook")

  # Skip macOS metadata files and anything that isn't a plain file
  [[ "$name" == Icon* ]] && continue
  [[ "$name" == .* ]] && continue
  [ -f "$hook" ] || continue

  dest="$HOOKS_DEST/$name"
  cp "$hook" "$dest"
  chmod +x "$dest"
  echo "Installed: .git/hooks/$name"
done

echo "Done. All Reggie hooks installed."
