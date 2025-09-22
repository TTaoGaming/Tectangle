---
id: ww-2025-122
owner: @you
status: active
expires_on: 2025-10-05
guard: npm run -s hex:overlay:verify (adds gsos idle)
flag: FEATURE_GSOS_AUTOSTART_ON_CLIP
revert: remove test edit + note
---
# Webway: GSOS MP4 iframe probe

## Goal

Stabilize GSOS e2e by explicitly opening the camera app and targeting its iframe for MP4-replay readiness and sampling.

## Constraints

- Keep tests deterministic via MP4 shim; no live camera.
- Don’t change GSOS behavior for users; test-only harness edits.
- CI must stay green.

## Current Map

- GSOS embeds camera pages as iframes; camera isn’t auto-opened by default. Tests looked at top-level window for `__cam`/`#fps` and timed out.

## Timebox

20 minutes (defaults)

## Research Notes

- GSOS uses `window.__gso.openApp('camera')` to open the camera card (source: gesture_shell_os_v1.html).
- Wallpaper is optional (`?GSOS_WALLPAPER=1`) and off by default; we disable to avoid dual capture (source: gesture_shell_os_v1.html).
- v2 harness exposes `window.__cam` and `#fps` inside the iframe (source: camera_landmarks_wrist_label_v2.html).
- MP4 shim applies to same-origin iframes when installed with evaluateOnNewDocument (source: jest-puppeteer pattern).

## Tool Inventory

- Jest-Puppeteer e2e, MP4 getUserMedia shim, http-server tasks, goldens.

## Options (Adopt-first)

1. Baseline — Require `?GSOS_OPEN=camera` in test URL and wait in iframe.
   - Trade-offs: Minimal, reversible; explicit.
2. Guarded extension — Call `window.__gso.openApp('camera')` after load, then select iframe by URL pattern.
   - Trade-offs: Resilient to default open list; still minimal.
3. Minimal adapter — Add a top-level proxy `window.__cam` in GSOS when a single camera iframe exists.
   - Trade-offs: Intrusive to runtime; not needed now.

## Recommendation

Option 2. Programmatically open the camera card and scope waits to the iframe.

## First Slice

- Edit `tests/e2e/gsos_idle_label_stability.test.js` to open camera and query iframe for readiness and samples.

## Guard & Flag

- Guard: test passes under MP4 replay; fails if `fps<=0` or recognizers not ready.
- Flag: `FEATURE_GSOS_AUTOSTART_ON_CLIP` remains default; no change needed.

## Industry Alignment

- E2E harnesses for iframe apps open target windows and select child frames explicitly.

## Revert

- Revert the single test file edit.

## Follow-up

- Add pinch-sequence GSOS test variant once v13 is reintroduced behind flag.
