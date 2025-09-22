---
id: ww-2025-094
owner: @you
status: active
expires_on: 2025-10-05
guard: npm run -s hex:smoke:golden (v2 stays green); v3 visual smoke manual
flag: FEATURE_GESTURE_VIZ_V3
revert: remove v3 overlay/panel and set display:none; keep v2 intact
---
# Webway: V3 floating telemetry panel + hand dots overlay

## Goal

Add a clarity-first floating, draggable, closable telemetry panel to v3, plus an optional hand landmark dots overlay, without impacting v2 or breaking CI.

## Constraints

- Offline-only: local ESM/WASM + local .task models (source: defaults/message)
- Dependencies: reuse @mediapipe/tasks-vision only; no new libs (source: codebase)
- Perf: keep overlay/landmarker optional and cheap; target ~200ms budget per frame (source: defaults)
- Privacy/security: no telemetry; local only (source: defaults)
- CI: existing v2 guards must stay green (source: codebase)

## Current Map

- v2 stable with visuals and e2e guard; v3 cloned with flags and hooks (source: codebase)

## Timebox

- 20 minutes initial slice; extend if tests require (source: defaults)

## Research Notes

- GestureRecognizer numHands=2 fixed two-hands guard (source: codebase)
- HandLandmarker can share FilesetResolver; model path must be local (source: docs/codebase)

## Tool Inventory

- npm scripts: hex:smoke:golden, test:e2e, heartbeat (source: package.json)
- static server via http-server on 8080/8091 (source: tasks)
- jest+puppeteer with server reuse/skip (source: jest-puppeteer.config.cjs)

## Options (Adopt-first)

1. Baseline — Keep v2 visuals; add minimal CSS-only floating card.
   - Trade-offs: fast, limited; no overlay.
2. Guarded extension — Panel + optional overlay using HandLandmarker behind flag.
   - Trade-offs: meets goal; small perf cost when enabled.
3. Minimal adapter — Render dots using gesture landmarks only.
   - Trade-offs: less accurate; simpler, but not true landmarks.

## Recommendation

Option 2: Panel + optional HandLandmarker overlay behind FEATURE_GESTURE_VIZ_V3; falls back gracefully if model missing.

## First Slice

- Add overlay canvas, draggable panel, exports, and toggles. Wire optional HandLandmarker with local model. Preserve v2.

## Guard & Flag

- Guard: keep existing v2 e2e green; smoke v3 manually for visuals.
- Flag: FEATURE_GESTURE_VIZ_V3

## Industry Alignment

- MediaPipe Tasks offline bundling and local models are the standard path for privacy-first demos (source: docs)

## Revert

- Remove panel block and overlay; or set display:none; delete hand landmarker init; retain v2.

## Follow-up

- Add tests or a tiny smoke for v3 visuals; perf sample when overlay is on; add FAB position memory and mobile drag handle.
