---
id: ww-2025-026
owner: @TTaoGaming
status: active
expires_on: 2025-10-08
guard: run sdk pinch + idle smokes, then size-only compare
flag: FEATURE_SDK_IDLE_GUARD_V1
revert: remove folder/flag
---
 
# Webway: SDK idle smoke + size guard

Goal: Add deterministic idle (no-lock) facade smoke and a stable size-only comparator for goldens.
Proven path: Mirror verify_sdk_facade_mp4_enriched.smoke.mjs using JSONL injection; adopt size-only compare as guard.
Files touched: September2025/TectangleHexagonal/tests/smoke/verify_sdk_facade_idle_no_lock.smoke.mjs; September2025/TectangleHexagonal/tools/compare_summary_size.mjs; package.json scripts
Markers: WEBWAY:ww-2025-026:
Next steps:

- Run pinch facade smoke → idle facade smoke → size-only compare.
- Promote comparator to content-aware when ready; remove flag before TTL.
