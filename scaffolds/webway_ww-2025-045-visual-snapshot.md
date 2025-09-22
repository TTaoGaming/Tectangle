---
id: ww-2025-045
owner: @tommy
status: active
expires_on: 2025-10-09
guard: jest test: visual_snapshot.regression
flag: FEATURE_VISUAL_SNAPSHOT
revert: remove folder/flag
---
# Webway: Demo-agnostic visual snapshot

Goal: Demo-independent, deterministic mid-clip screenshot with a lightweight size guard; daily CI.

Proven path: Puppeteer headful screenshot with URL-seeded state; extend to pixel-diff.

Files touched:

- September2025/TectangleHexagonal/tests/golden-master/visual_snapshot.regression.test.mjs
- package.json (scripts)
- .github/workflows/visual_snapshot_daily.yml

Markers: WEBWAY:ww-2025-045:

Next steps:

- Swap size guard for pixelmatch or jest-image-snapshot with baseline control.
- Add multiple pages/clips via a small JSON manifest.
- Gate with FEATURE_VISUAL_SNAPSHOT if any UI changes needed.
