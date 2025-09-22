# Hexagonal UI: Key + Human Demo + Camera Overlay

Date: 2025-09-05
Owner: You
Status: Draft (P0 executable)

## Why

- Keep the Human demo intact for rapid iteration and confidence (menus, toggles, GPU backends).
- Keep our logic adapterized and orthogonal: input (Human), domain (FSM), output (Key).
- Provide a dead-simple, phone-friendly overlay that only draws two dots—index tip and thumb tip.

## What (Outcome)

- Three-pane page:

  1. Key pane: one big keycap showing chosen key; lights on pinch; shows hold ms.
  2. Human demo pane: full upstream demo (from local `human-main-referenceonly/human-main/demo/index.html`).
  3. Camera overlay pane: raw camera view (mirrored) with only 2 dots drawn on top.

- Hexagonal ports wrap all vendor specifics:

  - HumanAdapter: normalize variadic Human outputs → 21 landmarks in [0..1], plus boxPx & coordMode.
  - PinchFSM: deterministic state machine (Open → Possible → Pinch → Anchored) with debounce/hold.
  - KeyboardAdapter: keydown/keyup to a target (document by default).
  - MetricsAdapter: FPS and small telemetry.

## Architecture (Hexagonal + Pipes/Filters)

- Domain: PinchFSM and pure helpers (pinch metric, palm gate) — pure and testable.

- Adapters:
  - In: HumanAdapter(Human): detect() → {landmarks[21], coordMode, boxPx}.
  - Out: KeyboardAdapter(document): keydown/keyup(key).
  - Cross-cutting: MetricsAdapter.tick() → fps.

- Composition:
  - UI shell wires adapters; no vendor code in domain.
  - Human demo stays sandboxed; we don’t inject or patch it.

```mermaid
flowchart LR
  Cam((Camera)) --> HA[HumanAdapter]
  HA -->|landmarks| PM[Pinch Metric]
  PM --> FSM[PinchFSM]
  FSM -->|keydown/keyup| KA[KeyboardAdapter]
  HA -->|landmarks| Viz[Overlay Canvas]
  Demo[Human Demo (iframe)]:::demo

  classDef demo fill:#222,stroke:#555,color:#eee
```

## Interaction Contract

- Inputs:
  - landmarks: Array of 21 with x,y in [0..1] (normalized to the active overlay size), z optional.
  - gate: boolean (palm facing camera → true).
  - thresholds: tEnter, tExit, debounceMs, anchorHoldMs.

- Outputs:
  - FSM state and events: keyDown, keyUp.
  - Overlay rendering: two dots (raw+smoothed tips 4 and 8) at (x*W, y*H).

- Error modes:
  - No hands: render hint and set state Open; no key events.
  - Backend slow: FPS badge warns; still functional.

## Edge Cases

- Different Human result shapes: hands vs hand; keypoints vs landmarks; fallback handled in adapter.
- Coord mismatch: infer coordMode and normalize using the current overlay size.
- Mirroring: overlay uses CSS scaleX(-1) to match the Human demo default mirror.

## Implementation Notes

- Use local Human demo: `human-main-referenceonly/human-main/demo/index.html` in an iframe. Windows path example: `c:\\Dev\\Spatial Input Mobile\\human-main-referenceonly\\human-main\\demo\\index.html`.
- Keep our camera feed separate for detection; do not attempt to control the demo.
- Keep overlay lightweight: one 2D canvas; no reflow per frame.
- Phone-friendly defaults: WASM backend at 640×480; allow switching.

## Milestones

1. P0: Scaffold three panes; load local Human demo; draw overlay dots from HumanAdapter; wire Key pane.
2. P1: Swap inline FSM usage for shared `src/fsm/pinchFsm.mjs` ESM import in browser.
3. P2: Add a “Flip gate” toggle and show coordMode in badges.

## Risks & Mitigations

- Cross-origin: if demo runs from file://, use the local path to avoid CORS. Keep overlay separate.
- Performance: avoid heavy DOM; stick to canvas; tune OneEuro params.
- Drift in Human API: adapter insulates UI; pin vendor version.

## Try It

- Serve workspace and open the three-pane page.
- Start camera; pinch to see keycap light and dots track tips.
- Toggle backend/res if needed; compare with Human demo visuals.
