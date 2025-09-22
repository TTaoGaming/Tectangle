#!/usr/bin/env sh
set -eu

TS=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
DEST="archive-stale/archive-$TS"
mkdir -p "$DEST"
echo "Creating snapshot at $DEST"
tar --exclude='./node_modules' --exclude='./.venv' --exclude='./archive-stale' --exclude='./.git' -czf "$DEST/workspace-$TS.tar.gz" .
echo "Snapshot created: $DEST/workspace-$TS.tar.gz"
echo ""
echo "When opening a PR, add this line to the PR description:"
echo "BACKUP-CREATED: $DEST"