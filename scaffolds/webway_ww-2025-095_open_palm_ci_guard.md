---
id: ww-2025-095
owner: @tommy
status: active
expires_on: 2025-10-05
guard: npm run -s hex:openpalm:idle
flag: FEATURE_GESTURE_TELEM_V3
revert: remove script + runner; reset window.__v3 hooks
---
# Webway: Open_Palm idle CI guard

## Goal

Establish a small, adopt-first CI check on the v3 offline demo using the golden idle MP4 to verify two-hands presence and Open_Palm visibility per hand, producing JSONL and a JSON summary with pass/fail gates.

## Constraints

- deps_budget=none (reuse Puppeteer already present)
- perf_budget_ms=200 (page loads and processes under typical CI limits)
- privacy/security: no external network; local assets only
- ci=must pass; reversible and flagged

## Current Map

- v3 offline page already buffers telemetry rows and JSONL; exposes window.__v3 hooks.
- Golden MP4 exists: September2025/TectangleHexagonal/videos/golden/golden.two_hands_idle.v1.mp4.
- Existing Kalman runner provides Puppeteer patterns.

## Timebox

20 minutes (defaults)

## Research Notes

- Exposed getRows/getJsonl under WEBWAY:ww-2025-095 to stabilize headless hooks (source: dev/gesture_tasks_offline_v3.html)
- New runner computes per-hand Open_Palm frames and duration; asserts two-hands-any and Open_Palm-any for both hands (source: tests/smoke/open_palm_idle_ci.mjs)
- Script wired: hex:openpalm:idle (source: package.json)

## Tool Inventory

- npm scripts: hex:openpalm:idle (source: package.json)
- Puppeteer: ^24.19.0 (source: package.json)
- http-server task or jest-puppeteer server (source: repo)

## Options (Adopt-first)

1. Baseline — Puppeteer against v3 page; JSON summary only
   - Trade-offs: fastest, minimal code; limited diagnostics without JSONL
2. Guarded extension — Include JSONL artifact and thresholds via env
   - Trade-offs: more IO, but richer debuggability
3. Minimal adapter — Reuse V11 exporter and derive Open_Palm stats offline
   - Trade-offs: more moving parts; less direct validation of v3 page

## Recommendation

Option 2: Guarded extension for JSONL + summary for quick triage and deeper inspection when needed.

## First Slice

- Page hook patch (WEBWAY:ww-2025-095): expose getRows/getJsonl
- Runner: tests/smoke/open_palm_idle_ci.mjs
- Script: hex:openpalm:idle

## Guard & Flag

- Guard: npm run -s hex:openpalm:idle should pass (twoHandsAny && Open_Palm both hands)
- JSONL check: node September2025/TectangleHexagonal/tests/smoke/validate_open_palm_jsonl.mjs September2025/TectangleHexagonal/out/open_palm_idle.golden.jsonl
- Camera state check: node September2025/TectangleHexagonal/tests/smoke/wrist_label_state_matches_gesture.smoke.mjs
- Composite: npm run -s hex:guard:openpalm+camera
- Flag: FEATURE_GESTURE_TELEM_V3 already gates the page; runner is additive

## Industry Alignment

- MediaPipe Tasks offline validation; headless CI via Puppeteer (source: mediapipe tasks, puppeteer docs)
- Golden master verification patterns (source: repo precedent)

## Revert

- Remove runner and script; revert window.__v3 patch; delete artifacts

## Follow-up

- TTL check on 2025-10-05; consider adding min duration thresholds per-hand
- Unify model fetch hint names (gesture vs hand) across demos
- Consider elevating camera state check into CI tier if flake-free
