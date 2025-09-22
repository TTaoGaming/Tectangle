---
id: ww-2025-091
owner: @TTaoGaming
status: active
expires_on: 2025-09-27
guard: "npm run -s hex:smoke:dino && node tests/smoke/quick_count_hands_idle.smoke.mjs"
flag: HEX_INPUT_BRIDGE
revert: remove folder/flag
---
# Webway: Gesture-to-Key/Pointer Touch Emulation

## Goal

Bridge hand gestures to standard web inputs (keyboard, pointer, touch) so the camera view behaves like a touchscreen/joystick, enabling immediate control of embedded games (e.g., Dino) via pinch/pose without touching core pipelines.

## Constraints

- License: Use BSD-3 friendly Dino runner or same-origin wrapper (source: defaults|message|repo files)
- Perf budget: end-to-end gesture-to-input latency <= 200 ms; avoid jank (source: defaults)
- Deps budget: +0 new heavy deps; prefer existing infra/postMessage (source: defaults)
- Privacy: no telemetry; process locally (source: defaults)
- Security: avoid synthesizing keys across origins; use same-origin iframe + postMessage (source: repo files)
- CI: must pass existing hex unit + smoke; new bridge guarded behind flag (source: defaults|repo files)

## Current Map

- V13 integrated hand console exposes vmCore, shell.onEvent, seatLockAdapter; smoke verifies idle/no-lock pinch (source: tests/smoke/quick_count_hands_idle.smoke.mjs)
- Demo v5 has feature-flagged Dino sidecar UI scaffolding with iframe docking (source: September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v5_material.html)
- Prior scaffold: pinch iframe bridge via postMessage noted (source: September2025/TectangleHexagonal/scaffolds/webway_pinch-iframe-bridge.md)
- Adapter surface: createSeatLockRichAdapter(vmCore,shell) yields enriched seats/hands and emits pinch:down/up (source: src/ui/seatLockRichAdapter.js, tests)
- Scripts: hex:smoke:dino, vendor fetchers, v13 smoke harnesses exist (source: package.json)

## Timebox

timebox_minutes=20 (source: defaults)

## Research Notes

- package.json scripts show existing Dino vendor and smoke hooks (source: file:package.json)
- V13 page contract: globalThis.__ihcV13.{vmCore,seatLockAdapter,shell} (source: file:tests/smoke/quick_count_hands_idle.smoke.mjs)
- Dino sidecar UI already scaffolded behind flags (source: file:September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v5_material.html)
- Pinch event logging exists in vmCore (pinchLog) (source: file:September2025/TectangleHexagonal/src/ui/createHandConsoleViewModel.js)

## Tool Inventory

- Smoke: hex:smoke:dino; tests/smoke/run_video_vendor_dino.js (source: file:package.json)
- V13 smokes: tests/smoke/verify_v13_mp4_enriched.smoke.mjs; quick_count_hands_idle.smoke.mjs (source: files)
- Sidecar: dev/sidecars/dino_sidecar.mjs (referenced in v5 demo) (source: file:September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v5_material.html)

## Options (Adopt-first)

1. Baseline — postMessage key bridge
   - What: On pinch:down/up from shell.onEvent, send postMessage to same-origin Dino iframe. Inside iframe, translate to KeyboardEvent("keydown/keyup", { key: " ") and focus the canvas.
   - Why: Zero core changes; proven path with existing sidecar scaffold; quickest demo.
   - Where: dev/integrated_hand_console_v13.html (left), iframe(dino) on right; tiny sidecar listener.
   - Who: Seat P1 -> Space; Seat P2 optional mapping.
   - How: Feature flag HEX_INPUT_BRIDGE; URL param toggles; ensure same-origin.
   - Trade-offs: Limited to key-style games; key synthesis requires focus and same-origin.

2. Guarded extension — generic InputBridge port
   - What: Add a lightweight port/adapters: KeyAdapter, PointerAdapter, TouchAdapter. FSM maps pinch/pose to down/move/up with persistence (hysteresis) and predictive look-ahead window.
   - Why: Unlock mouse/touch emulation and 2D plane interaction using fingertip coordinates.
   - How: Publish bridge events from shell, consume in adapters; channel per seat; bounded smoothing.
   - Trade-offs: Slight complexity; needs careful debouncing/hysteresis to avoid ghost clicks.

3. Minimal adapter — fingertip -> pointer
   - What: Map index fingertip world->screen to pointermove; pinch toggles mousedown/up; victory sign -> right click.
   - Why: Fastest path to "camera as touchscreen" with minimal states; good UX probe.
   - Trade-offs: Calibration required; accidental clicks without lock/persistence; Z-to-2D mapping quirks.

## Recommendation

Option 1 to land in hours under HEX_INPUT_BRIDGE, then extend toward Option 3 for immediate pointer emulation; graduate to Option 2 after guard hardening.

## First Slice

- Add right-side iframe to v13 page showing Dino (same-origin). Wire shell.onEvent pinch:down/up -> postMessage {source:'hex',type:'pinch-key',seat}. In iframe, dispatch Space keydown/keyup to game canvas. Include a tiny badge showing seat routing.
- Verify with: "npm run -s hex:smoke:dino" passing and quick idle smoke staying PASS.

## Guard & Flag

- Guard: hex:smoke:dino must PASS; quick_count_hands_idle.smoke.mjs stays PASS; no new locks during idle.
- Flag: HEX_INPUT_BRIDGE (URL param hex_input_bridge=1) controlling sidecar attach and postMessage.

## Industry Alignment

- Standard: HTML postMessage, KeyboardEvent, Pointer Events Level 2; same-origin focus rules (source: defaults)
- State-of-the-art: Gesture-to-pointer bridges in AR/VR UIs; MediaPipe hands to web input adapters (source: defaults)

## Revert

- Disable HEX_INPUT_BRIDGE flag or remove sidecar script block and iframe.

## Follow-up

- TTL check (2025-09-27): evaluate latency and false positives; add hysteresis and persistence store.
- Add pointer/touch adapter with calibration and plane mapping; consider seeding + predictive look-ahead.
