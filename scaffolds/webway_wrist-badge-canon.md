---
id: ww-2025-001
owner: @TTaoGaming
status: active
expires_on: 2025-10-07
guard: npm run hex:contract (<=30s smoke + JSON diff)
flag: FEATURE_HEX_WRIST_BADGES
revert: remove folder/flag
---
# Webway: Wrist badges are canon
Goal: Persist seat labels at wrist with reservations and snap-back as an invariant.
Proven path: Replay + golden JSON diffs; CI headful smoke ≤30s.
Files touched: September2025/TectangleHexagonal/tests/smoke/run_video_check_seats.mjs; September2025/TectangleHexagonal/tests/smoke/assert_wrist_badge_contract.mjs; .husky/pre-commit; September2025/TectangleHexagonal/config/hex-boundary.cjs
Markers: WEBWAY:ww-2025-001:
Next steps: Add bootstrap DI test and dependency-cruiser rules to CI.
