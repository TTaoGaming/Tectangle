---
id: ww-2025-093
owner: @ttao
status: active
expires_on: 2025-10-04
guard: ci: hex:test:unit + smoke screenshot diff
flag: FEATURE_HANDS_SDK_TRY
revert: remove scaffolds note + demo pages; disable flag
---
# Webway: Hands SDK with visuals + API (adopt-first)

## Goal
Provide a downloadable, offline-capable hand-tracking project that exposes a clean JavaScript API and renders official-style visuals (landmarks + connectors + labels) with minimal wiring.

## Constraints
- License: permissive (Apache-2.0/MIT) only (source: defaults)
- Deps budget: 1 small lib max (source: defaults)
- Perf: <= 200ms TTI on mid Windows laptop; 30FPS target (source: defaults)
- Privacy/Security: offline, no telemetry; no secrets (source: defaults)
- CI: existing test tiers must pass (source: defaults)

## Current Map
- Repo already hosts Mediapipe Tasks Vision offline pages; custom v3 with feature flags; jest-puppeteer available (source: repo)

## Timebox
- 20 minutes research + 60 minutes integration slice (source: defaults)

## Research Notes
- Mediapipe Tasks Vision offers data-only API; visuals are sample code (source: docs)
- Precedents for packaged visuals + API:
  - MediaPipe Solutions Gallery: Hands JS sample with draw utils (source: web)
  - TensorFlow.js handpose + fingerpose for gestures (older, lower fidelity) (source: web)
  - @mediapipe/drawing_utils exposes connectors helpers (deprecated-ish but usable) (source: web)
  - Third-party wrappers: fingerpose rehashes, various TS wrappers without maintained visuals (source: web)

## Tool Inventory
- Static server tasks, jest-puppeteer, Silk Scribe logging, scaffolds, feature flags (source: repo)

## Options (Adopt-first)
1. Baseline — Keep Tasks Vision + bring in drawing helpers
   - Use @mediapipe/drawing_utils (or local copy) to render official connectors/landmarks
   - Provide a small JS API wrapper: start(), stop(), onResults(cb)
   - Trade-offs: add one dep or vendored utils; stays close to current code
2. Guarded extension — Minimal SDK wrapper module
   - Create src/sdk/hands.ts exposing createHands({ model, wasmBase }) returning controller with start/stop, subscribe, and canvas out
   - Ship demo page importing the SDK; feature-flag usage in v3
   - Trade-offs: small maintenance but clean API for tests
3. Minimal adapter — Iframe embed as API boundary
   - Treat the working offline demo as a micro-frontend; parent window calls start/stop via postMessage; visuals owned by iframe
   - Trade-offs: simplest isolation; cross-window messaging needed

## Recommendation
Option 2. A tiny wrapper module gives you a clean API and retains your existing offline setup. We can optionally vendor draw utils to avoid extra deps.

## First Slice
- Add src/sdk/hands_demo.js (no build) with ESM wrapper around HandLandmarker and a draw() util using our EDGES.
- Provide a demo page in dev/ that imports this module and shows full visuals.
- Add guard FEATURE_HANDS_SDK_TRY to v3 page to optionally switch to wrapper for side-by-side.

## Guard & Flag
- Guard: puppeteer screenshot diff of demo after 1s shows >=1 hand with >=10 connectors
- Flag: FEATURE_HANDS_SDK_TRY

## Industry Alignment
- Aligns with Google’s sample structure and drawing helpers; keeps wasm/models local for offline (source: web)

## Revert
- Delete src/sdk/hands_demo.js and demo page; remove flag usage; keep existing v3 behavior unaffected.

## Follow-up
- TypeScript definition for the wrapper; publishable package outline if desired; gesture API layered on top.
