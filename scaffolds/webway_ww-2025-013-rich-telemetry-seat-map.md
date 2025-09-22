---
id: ww-2025-013
owner: @maintainer
status: active
expires_on: 2025-10-08
guard: smoke: run RICH=1 harness -> expect .rich.summary.json with frames>0
flag: FEATURE_RICH_TELEM_V1
revert: remove WEBWAY markers + delete note + strip rich seat code in main.js & harness env logic
---

# Webway: Rich Telemetry + Seat Mapping Scaffold

Goal: Persist per-frame rich pinch telemetry with seat (P1/P2) mapping for dual-hand analysis.

Proven path: Extend existing processVideoUrl + smoke harness (similar pattern as prior automation hooks) with additive flag-gated data.

Files touched: main.js (processVideoUrl), tests/smoke/run_video_collect_golden.js (env RICH=1), new note.

Markers: WEBWAY:ww-2025-013

Next steps:

- Add finger joint angles + orientation into rich frames.
- Add test asserting presence of seat field and rich summary counts.
- Optional CLI flag (--rich) to supplement env for PowerShell ergonomics.
