---
id: ww-2025-084
owner: @webcartographer
status: active
expires_on: 2025-10-04
guard: ci:smoke-open-fist-dino (<= 10s load; Selects ≥ 1 in 5s)
flag: FEATURE_OPEN_FIST_DINO
revert: remove demo file + flag + index entries
---
# Webway: Open palm → fist to Dino jump

## Goal
Ship a simple, reliable demo that maps an “open palm → closed fist” gesture to a Space key for the Dino Runner, using our existing MediaPipe Hands landmarks and a tiny heuristic with hysteresis. Keep it visibly testable and reversible.

## Constraints

- License: use existing in-repo code and MediaPipe Hands (Apache 2) only (source: defaults)
- Dependency budget: 0 new runtime deps (source: defaults)
- Perf: ≤ 200ms E2E from fist to Space (desktop webcam) (source: defaults)
- Privacy/Security: no telemetry; no external network calls beyond CDN CSS (tailwind) (source: file)
- CI: must keep all existing tests green; optional smoke can be added (source: message)

## Current Map

- Demo file exists: `September2025/TectangleHexagonal/dev/open_palm_to_fist_dino.html` implementing a thumb–pinky span vs wrist-center ratio with hysteresis, posts Space to Dino iframe and shows a Select counter. (source: file)
- Static server tasks available (http-server on 8091) for local runs. (source: tasks)
- Silk Scribe indices exist and list prior Webways/logs. (source: file)

## Timebox
 
20 minutes to govern and log; optional 40 minutes to add a smoke after validation. (source: defaults)

## Research Notes

- Heuristic: uses landmarks [4,20,0] and a ratio threshold with open/close hysteresis to reduce flicker. (source: file)
- Game bridge: posts `{ type:'dino:key', action:'down'|'up', code:'Space' }` to the sidecar iframe, proven pattern from v5/v7 demos. (source: file)
- Runs without new libraries; mediated by existing `createSpatialInput` and mediapipe port accessors. (source: file)

## Tool Inventory

- Local servers: `Tasks → Start local static server 8091` (npx http-server). (source: tasks)
- Test tiers: hex unit/e2e runners; existing golden video infra for pinch (could host a hand-open→fist clip later). (source: tasks)
- Silk Scribe: SRL/ADR logs with index.md/json. (source: file)

## Options (Adopt-first)

1. Baseline — Keep the heuristic as-is, document it, and show selects incrementing. No new tests.
   - Trade-offs: fastest; no automated guard; demo-only confidence.
2. Guarded extension — Add a tiny smoke that loads the page, fakes detections via an exposed test hook, and asserts Selects ≥ 1.
   - Trade-offs: minimal harness work; strong CI signal; zero new deps.
3. Minimal adapter — Swap heuristic with MediaPipe Tasks Gesture Recognizer behind a flag and map “Closed_Fist” to Space.
   - Trade-offs: adds a new runtime; higher accuracy; larger slice/time.

## Recommendation
 
Option 2 to get a measurable guard with low effort; keep the heuristic behind `FEATURE_OPEN_FIST_DINO` for easy experimentation.

## First Slice

- Keep current demo intact. Expose a no-op test hook to simulate a “fist” tick for smoke. Wire a query flag `open_fist=1` to enable the loop if needed.

## Guard & Flag

- Guard: `ci:smoke-open-fist-dino` — puppeteer loads the demo; uses a page-eval hook to bump a fist tick; expects Selects ≥ 1 in ≤ 5s.
- Flag: `FEATURE_OPEN_FIST_DINO` — used to scope future adapter swaps; current demo is effectively always-on but marked with WEBWAY tags.

## Industry Alignment

- MediaPipe Hands landmarks-based heuristics are standard for quick prototyping. (source: message)
- MediaPipe Tasks Gesture Recognizer offers ready labels like “Closed_Fist” for production-grade mapping. (source: message)
- WebXR select semantics provide a migration path for game/UX parity. (source: message)

## Revert

- Delete `dev/open_palm_to_fist_dino.html` and remove WEBWAY markers/flag mentions. Drop SRL/ADR entries and index additions.

## Follow-up

- TTL check: by 2025-10-04 decide: keep heuristic or replace with Gesture Tasks adapter.
- Add optional smoke with a deterministic “fist” test hook.

