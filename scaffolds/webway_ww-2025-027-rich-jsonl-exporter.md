---
id: ww-2025-027
owner: @dev
status: active        # active|ready|done|expired
expires_on: 2025-10-08   # auto-expire TTL (21 days)
guard: npm run hex:guard:rich
flag: FEATURE_RICH_SEAT_LOCK_V10
revert: remove folder/flag
---

# Webway: Rich JSONL Exporter (V11)
Goal: Export per-seat enriched telemetry post-lock, per frame, to JSONL for manual review and downstream tooling.
Proven path: V11 research console + Puppeteer sampling (tools/export_rich_jsonl.mjs)
Files touched: tools/export_rich_jsonl.mjs, package.json (scripts), README note
Markers: WEBWAY:ww-2025-027
Next steps: Extend exporter to include sidecar stream and V12 diffs; add perf budget check on rows/sec.
