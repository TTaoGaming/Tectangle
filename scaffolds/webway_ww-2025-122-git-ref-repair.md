---
id: ww-2025-122
owner: @TTaoGaming
status: active
expires_on: 2025-09-29
guard: git fsck --no-reflogs --full --connectivity-only --strict returns 0
flag: FEATURE_GIT_REPAIR_SAFE
revert: remove note/logs; restore refs from reflog tag rescue_pre_nuclear_2025-09-22
---
# Webway: Repair local Git refs and commit-graph safely

## Goal

Stabilize local Git so VS Code Source Control works: restore missing heads, remove corrupt remote-tracking refs, disable auto-commit-graph, rebuild a clean baseline at commit 1e88a5d6.

## Constraints

- No data loss; preserve a revert tag (source: defaults)
- Privacy/security: no secrets pushed (source: defaults)
- CI must pass once repo usable (source: defaults)

## Current Map

- HEAD pointed to refs/heads/main but heads dir lacked main; reflog had entry to 1e88a5d6 (source: message)
- fsck showed invalid remote pointers (origin/HEAD, origin/main -> 6bfcbae…), stale commit-graph and cache-tree errors (source: message)

## Timebox

20 minutes (source: defaults)

## Research Notes

- Recreated refs/heads/main from .git/logs/refs/heads/main to 1e88a5d6 (source: message)
- Deleted corrupt refs/remotes/origin/* and refetched; disabled auto-gc and commit-graph to avoid missing-object crashes (source: message)
- Missing tree f0bf… referenced by stale index/commit-graph; commit tree a846… for 1e88a5d6 exists (source: message)

## Tool Inventory

- git: show-ref, update-ref, fsck, fetch, gc config, show/cat-file (source: message)
- VS Code tasks: none required (source: defaults)

## Options (Adopt-first)

1. Baseline – Nuke and reclone
   - Trade-offs: fastest, loses local reflogs/untracked (risk)
2. Guarded extension – Local repair from reflog (chosen)
   - Trade-offs: preserves history; a bit manual but reversible
3. Minimal adapter – Convert to bare + new worktree
   - Trade-offs: clean worktree; slightly more setup

## Recommendation

Option 2: Repair in place using reflog and disable commit-graph; fetch clean remotes.

## First Slice

- update-ref refs/heads/main 1e88a5d6
- delete refs/remotes/origin/{HEAD,main}; fetch --all --prune --tags
- git config gc.auto 0; fetch.writeCommitGraph=false; gc.writeCommitGraph=false
- del .git/index; attempt git reset --hard 1e88a5d6

## Guard & Flag

- Guard: fsck strict returns 0, status clean
- Flag: FEATURE_GIT_REPAIR_SAFE

## Industry Alignment

- Git maint best-practices: avoid stale commit-graphs; prefer reflog-based restore (source: defaults)

## Revert

- Restore previous state via tag rescue_pre_nuclear_2025-09-22; re-create remote refs with fetch

## Follow-up

- If fsck still fails: remove .git/objects/info/commit-graph, run git commit-graph write --reachable after fetch
- Optional: git repack -Ad; git prune --expire=now once healthy
