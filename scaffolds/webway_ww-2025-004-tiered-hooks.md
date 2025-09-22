---
id: ww-2025-004
owner: @you
status: active
expires_on: 2025-10-07
guard: pre-push full gate (lint+unit+contract strict)
flag: FEATURE_TIERED_HOOKS
revert: remove hooks edits & this note
---
# Webway: Tiered Git Hooks (Fast pre-commit, Full pre-push)

Goal: Reduce multi-minute commit lag by shifting heavy contract + full unit suite to pre-push while keeping boundary lint + focused tests at commit time.
Proven path: Tiered hook strategy (fast commit, full verify before remote) from large JS repos.
Files touched:

- .husky/pre-commit
- .husky/pre-push
- September2025/TectangleHexagonal/tools/run_focused_tests.mjs

Markers: WEBWAY:ww-2025-004:

Next steps: Monitor average pre-commit duration; if >10s, add depcruise caching or incremental test mapping. Consider weekly/monthly workflows later.
