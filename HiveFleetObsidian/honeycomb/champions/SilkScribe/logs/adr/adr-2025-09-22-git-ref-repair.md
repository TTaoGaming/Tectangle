# ADR | 2025-09-22T17:05:00Z | ww-2025-122

Context: Local repo showed broken refs (origin/*) and stale commit-graph/index; HEAD to main existed but main ref missing.
Decision: Recreate refs/heads/main from reflog (1e88a5d6), delete corrupt remote-tracking refs, disable commit-graph auto writes, fetch clean refs. Preserve revert tag.
Consequences: VS Code Git should stabilize; fsck errors reduced. If reset remains blocked by missing trees, consider reclone or bare+worktree.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-122-git-ref-repair.md)
