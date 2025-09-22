---
id: ww-2025-090
owner: @TTaoGaming
status: active
expires_on: 2025-10-05
guard: npm run -s hex:smoke:golden:idle && node tests/smoke/quick_count_hands_idle.smoke.mjs && cross-env JEST_PUPPETEER_CONFIG=jest-puppeteer.config.cjs jest --config jest.config.e2e.cjs --runInBand --detectOpenHandles --testPathPattern open_palm_idle_jsonl.test.js
flag: FEATURE_WEBWAY_WW_2025_090
revert: remove tests/smoke/quick_count_hands_idle.smoke.mjs and September2025/TectangleHexagonal/tests/e2e/open_palm_idle_jsonl.test.js
---
# Webway: Golden idle shows 2 hands, no locks (open palms)

## Goal

Validate the golden idle MP4 yields two hands visible and no seat locks (interpreted as open palms), and capture a small automated guard.

## Constraints

- Use existing frozen V13 UI and smoke harnesses; avoid modifying core runtime.
- Keep server static hosting simple (http-server); run locally at 8080/8091.
- CI must remain green; guard must be fast (<15s).

## Current Map

- V13 page `dev/integrated_hand_console_v13.html` surfaces VM/adapter snapshots and enriched metrics.
- Existing smoke `verify_v13_mp4_idle_no_lock.smoke.mjs` asserts no locks but didn’t explicitly count hands.
- Static server must be running; earlier failures were due to server not available on 8080.

## Timebox

20 minutes (source: defaults)

## Research Notes

- Idle smoke passes when server is up: anyLock=false, frames≈47, anglePresence=0 (source: tests run)
- Quick probe initially missed hands via __hexLastHands; VM snapshot is reliable after ~6s; maxHands=2, pinchDowns=0 (source: tests run)
- v3 Kalman telemetry guard fails on idle due to handIdNullFrames>0 in this context; not required for idle validation (source: tests run)

## Tool Inventory

- npm script: hex:smoke:golden:idle → `tests/smoke/verify_v13_mp4_idle_no_lock.smoke.mjs`
- quick probe: `tests/smoke/quick_count_hands_idle.smoke.mjs` (added)
- static server tasks: `Start local static server 8091` (VS Code task) (source: package.json, tasks)

## Options (Adopt-first)

1. Baseline — Run existing idle smoke and manually inspect summary
   - Trade-offs: manual hand count missing; fast and stable.
2. Guarded extension — Add tiny probe to count hands via VM snapshot and ensure 0 locks, 0 pinch downs
   - Trade-offs: adds a small test file; no runtime risk.
3. Minimal adapter — Emit palmAngleDeg for unlocked seats in enriched to quantify openness
   - Trade-offs: touches adapter; potential ripple; defer.

## Recommendation

Option 2 because it adds a low-risk, fast guard that directly answers the question and can run in CI.

## First Slice

- Add `tests/smoke/quick_count_hands_idle.smoke.mjs` to count hands via VM and assert no locks/pinch events.
- Add Jest e2e `September2025/TectangleHexagonal/tests/e2e/open_palm_idle_jsonl.test.js` to validate Open_Palm both hands via v3 JSONL hooks.
- Run against golden idle clip via 8091 server: PASS with maxHands=2; palmPresence=0; anyLock=false; Open_Palm on both hands observed.

## Guard & Flag

- Guard: run idle smoke + quick probe during commit tier.
- Flag: FEATURE_WEBWAY_WW_2025_090 (placeholder; no runtime gating used).

## Industry Alignment

- Use synthetic golden assets + headless browser smokes for gesture pipelines is standard practice for reproducible CV signal validation (source: message, defaults).

## Revert

- Delete the probe test file and remove any CI references.

## Follow-up

- TTL check by 2025-10-05: consider enriching palm openness metric for unlocked seats.
- Wire guard into `hex:tier:commit` if desired.
