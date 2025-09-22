---
id: ww-2025-031
owner: @ttao
status: active
expires_on: 2025-10-09
guard: npm run -s hex:verify:fast
flag: FEATURE_FREEZE_HEX_ALL
revert: remove folder/flag
---

# Webway: Hex freeze-all snapshot
Goal: Freeze entire `September2025/TectangleHexagonal` tree into `archive-stale/tectanglehexagonal_freeze_<timestamp>` for regression/reference.
Proven path: Prior freezes in `archive-stale/*tectanglehexagonal_freeze_*` and `tools/freeze_dino_snapshot.mjs`.
Files touched: `September2025/TectangleHexagonal/tools/freeze_all.mjs`, `package.json` (script), this note.
Markers: WEBWAY:ww-2025-031:
Next steps: Optionally add CI job to run `npm run -s hex:freeze:all` on demand and publish artifact hash.
