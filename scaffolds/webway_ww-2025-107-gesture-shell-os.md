---
id: ww-2025-107
owner: @ttao
status: active
expires_on: 2025-10-12
guard: e2e guards — gsos_idle_label_stability + gsos_seat_transitions (deterministic replay)
flag: FEATURE_SEAT_MANAGER_V1
revert: remove GSOS page + SeatManager and flag gates
---
# Webway: GestureShellOS — SeatManager v1 (seated/unseated, no cross-contamination)

## Goal

Clone the v2 wrist-label camera demo into a new GestureShellOS page and introduce a SeatManager v1 (per-hand tracks with unseated → seated claim/hold/reacquire/release). Eliminate HUD label cross-contamination, keep v2 unchanged, and land guards.

## Constraints

- Offline-only; CI-friendly (headless). (source: defaults)
- No telemetry/network secrets; deterministic clips via captureStream/ReplayLandmarks. (source: repo/tests)
- Minimal deps; reuse existing shell bar + WinBox host. (source: codebase)
- Keep current tests green; GSOS behind a feature flag. (source: message)

## Current Map

- v2 demo: `September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v2.html` (shell, dark theme, seats, HUD, hooks). (source: file)
- HUD stability guard exists for v2. ReplayLandmarks hex available. (source: files)
- Bottom app bar + WinBox host and Settings persistence are live. (source: files)

## Timebox

20 minutes (defaults)

## Research Notes

- Wrist HUD cross-contamination previously mitigated with alignment cache; needs stronger seat logic (explicit claim/hold/reacquire). (source: message)
- Request: clone work into “GestureShellOS” and add unseated/seated transitions with guards. (source: message)
- Tests rely on deterministic MP4 and server reuse. (source: files)

## Tool Inventory

- jest-puppeteer e2e + static server tasks (8091). (source: package.json)
- ReplayLandmarks hex (`src/hex/replayLandmarksHex.js`). (source: file)
- Shell OS (`src/ui/shell/shell_os.js`), WinBox host (`src/ui/winBoxHost.js`). (source: files)
- Settings hex + LocalStorage adapter. (source: files)

## Options (Adopt-first)

1. Baseline — Clone v2 page to GSOS, no behavior changes, just a new entry point and WEBWAY markers.
   - Trade-offs: Fast, reversible; does not fix contamination until SeatManager lands.
2. Guarded extension — Add SeatManager v1 behind FEATURE_SEAT_MANAGER_V1; per-hand track FSM: unseated → claim (debounced) → seated → reacquire by anchor within grace → release on timeout.
   - Trade-offs: Slight complexity; gated; keeps v2 stable; measurable via new guards.
3. Minimal adapter — Only add claim cooldown and stricter label-score thresholding; rely on existing tracker alignment.
   - Trade-offs: Simpler but may not fully stop cross-contamination in hand-cross scenarios.

## Recommendation

Option 2: land GSOS page, implement SeatManager v1 behind a flag, and add e2e guards. Reversible and leaves v2 untouched.

## First Slice

- Add page `September2025/TectangleHexagonal/dev/gesture_shell_os_v1.html` cloned from v2 with WEBWAY markers and FEATURE_SEAT_MANAGER_V1 (default ON for this page only).
- Create `September2025/TectangleHexagonal/src/app/seatManager_v1.js` exposing: createSeatManager({maxSeats, claimMs, snapRadius, lossGraceMs, cooldownMs}) with methods: onFrame(rawHands, stableIds, tNow), getState(), getSeatMap().
- Wire GSOS to call SeatManager when flag enabled; HUD shows seat labels from manager output.
- Keep v2 references intact; no behavior change there.

## Guard & Flag

- Guard: `tests/e2e/gsos_idle_label_stability.test.js` — deterministic idle clip; per-key labels/handedness don’t flip; per-hand seat mapping stable.
- Guard: `tests/e2e/gsos_seat_transitions.test.js` — claim on open-palm; release on loss; reacquire near anchor within grace; no cross-claim during cooldown.
- Flag: FEATURE_SEAT_MANAGER_V1 (page-local default ON in GSOS; controllable via URL for experiments).

## Industry Alignment

- Controller seat management mirrors multiplayer input routing patterns: claim/hold/decay; debounced controller assignment; spatial anchors for reacquire. (source: defaults)

## Revert

- Delete GSOS page and SeatManager module; remove FEATURE_SEAT_MANAGER_V1 checks. Existing v2 page and tests remain green.

## Follow-up

- TTL check: 2025-10-05 — promote SeatManager to shared adapter if guards show clear win.
- Add KeyMap/WristCompass integration once v0 schema lands (WW-104).
- Route events into SDK/API v0 facade (WW-105) and GameBridge Dual Dino (WW-106).
