---
id: ww-2025-102
owner: @ttao
status: active
expires_on: 2025-10-05
guard: jest e2e v2_hud_label_stability.test.js
flag: FEATURE_HUD_ALIGNED_LABEL
revert: remove test + test hook
---
# Webway: v2 HUD label stability guard

## Goal
 
Ensure gesture labels and handedness don’t flip across hands during short idle sequences in the v2 camera demo.

## Constraints
 
- No network fetches in CI; reuse local idle MP4 via captureStream.
- Keep changes reversible and off the hot path (test hook only).

## Current Map
 
- v2 page aligns recognizer→detector by nearest wrist and caches by stable key.
- Lacked a public hook to read aligned labels per key for tests.

## Timebox
 
20 minutes (defaults)

## Research Notes
 
- Existing shims in smoke tests for getUserMedia via captureStream (source: tests/smoke/*v2*.mjs)
- Deterministic replay hooks exist in main.js but not used by v2 page (source: src/app/main.js)

## Tool Inventory
 
- Jest-Puppeteer e2e config (source: jest.config.e2e.cjs)
- http-server on 8080 task (source: tasks)

## Options (Adopt-first)
 
1. Baseline — Headful smoke with manual observation only.
   - Trade-offs: No guard; can regress silently.
2. Guarded extension — Add minimal test hook + e2e using MP4 shim.
   - Trade-offs: Tiny coupling to page; fast and deterministic.
3. Minimal adapter — Route through __hex.replayLandmarks and synthetic frames.
   - Trade-offs: More wiring now; richer later.

## Recommendation
 
Option 2 to get a quick guard with minimal surface.

## First Slice
 
- Expose getAlignedLabels on __cam returning { perHand, byKey }.
- Add v2_hud_label_stability.test.js using captureStream shim and assert per-key stability.

## Guard & Flag
 
- Guard: new jest test must pass.
- Flag: FEATURE_HUD_ALIGNED_LABEL kept default ON; test only reads state.

## Industry Alignment
 
- Deterministic replays for CV pipelines are standard in CI to avoid flakiness.

## Revert
 
- Delete the test and remove the __cam.getAlignedLabels hook.

## Follow-up
 
- Promote to page-replay via __hex.replayLandmarks for stronger determinism.
