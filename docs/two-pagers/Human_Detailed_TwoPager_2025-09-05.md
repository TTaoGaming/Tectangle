@vladmandic/human — Detailed Two‑Pager (API & Gesture Strategy)
==============================================================

Metadata
--------

- title: @vladmandic/human — Detailed Two‑Pager (API & Gesture Strategy)
- doc_type: two-pager
- timestamp: 2025-09-05T00:25:00Z
- tags: [Human, API, pose, hands, gestures, pinch, TOI]
- summary: Practical overview of Human capabilities, core API surface, built‑in gestures vs custom math, and how to integrate for deterministic PinchFSM + broader gesture vocabulary.

Page 1 — Capabilities & Core API (5W1H)
---------------------------------------

Why

- Single JS/TS CV toolkit exposing hands, body pose, face, segmentation, gestures under one config & result object.

What (Major Modules)

- Hand: 2D/3D keypoints (21 landmarks per hand) + basic finger state heuristics.
- Body/Pose: Full‑body keypoints (model selectable). Useful for elbow/shoulder orientation or global movement gating.
- Face: Mesh, expressions (optional) if needed for user state or orientation.
- Gesture: Lightweight rule engine deriving coarse gestures from keypoints (e.g., open hand, fist, pointing). Not a high‑precision pinch w/ hysteresis.
- Others (toggle as needed): segmentation, object, face iris, age/gender (disable for performance/privacy unless required).

Who

- You (PinchFSM) primarily need Hands now; may selectively enable Body (orientation), Gesture (broad vocab), optionally Face for future gating.

When

- Real‑time in browser/headless; offline batch for deterministic trace generation (your current pipeline).

Where

- Runs in browsers (WebGL/WebGPU/CPU/WASM) & Node via headless Chromium (your approach). Avoid native tfjs-node for determinism/complexity.

How (Essential API Shape)

```ts
import Human from '@vladmandic/human';

const config = {
  backend: 'wasm',            // or 'webgl'/'webgpu' if determinism tradeoffs acceptable
  modelBasePath: '/dist/models',
  hand:   { enabled: true, maxDetected: 1 },
  body:   { enabled: false },
  face:   { enabled: false },
  gesture:{ enabled: true },  // to get basic gesture labels
  filter: { enabled: false }, // disable built-in smoothing for raw deterministic values
  cacheSensitivity: 0,        // reduce adaptive behavior for repeatability
};

const human = new Human(config);
await human.load();           // downloads/initializes selected models

// per frame (image/canvas/video frame)
const res = await human.detect(sourceElement);

// results layout (simplified)
// res.hands: [{ confidence, box, keypoints: [ {x,y,z?,score,name} x21 ], annotations? }]
// res.body:  [{ keypoints: [...] }]
// res.face:  [{ keypoints: [...] }]
// res.gesture: [{label, score, hand?, fingerprint?}]
```

Result Handling

- Access `human.result` (or return value of `detect`). Always guard for empty arrays.
- Landmarks are typically normalized [0..width/height] or pixel coordinates depending on config/model; confirm once and standardize.
- For determinism: force a single backend, disable internal temporal filtering, avoid dynamic resizing.

Performance & Determinism Notes

- WASM backend + single-threaded + fixed canvas size → most stable.
- Avoid enabling unneeded models (face/body) if not consumed; each adds load + potential minor timing jitter.
- Pin exact package version and host models locally (already done).

Built‑In Gesture Layer

- Provides coarse categorical labels (e.g., open, closed, maybe simple pinch/ok) via rule heuristics.
- Pros: instant vocabulary for prototypes (menu navigation, basic state cues).
- Cons: not tuned for low-latency, millisecond‑precise pinch transitions or controlled hysteresis thresholds; limited configurability.

Custom Gesture (Math‑Driven)

- Derive domain metrics (e.g., P = dist(thumb_tip,index_tip)/dist(index_mcp,pinky_mcp)).
- Apply palm normal gating, hysteresis (T_enter/T_exit), temporal debouncing, TOI (time‑of‑impact) prediction.
- Gives you deterministic Strike/Lift semantics required by your FSM.

Decision Matrix (Built‑In vs Custom)

| Need | Built-In Gesture | Custom Math |
| ---- | ---------------- | ----------- |
| Fast prototyping variety | ✅ | ⚠ (extra work) |
| Precise pinch boundaries | ❌ | ✅ |
| Deterministic reproducibility | ⚠ (heuristics) | ✅ |
| Latency optimization | Limited | Tunable |
| Complex multi-stage FSM | Weak | Strong |

Page 2 — Applying Human to PinchFSM & Gesture Strategy
------------------------------------------------------

PinchFSM Inputs

- Minimal: `hand.keypoints` (21). Required indices: thumb_tip=4, index_tip=8, index_mcp=5, pinky_mcp=17, wrist=0.
- Optional: body orientation (if later gating by shoulder/wrist alignment) → enable body model.

Pipeline Modes

1. Offline (deterministic traces): current PNG frame loop + WASM backend. Store JSONL.
2. Live (runtime UX): choose backend by device (webgl/webgpu if acceptable) but still feed FSM identical metric computations.

Suggested Config Profiles

| Profile | Purpose | hand | gesture | body | filter | backend |
| ------- | ------- | ---- | ------- | ---- | ------ | ------- |
| offline-ci | Golden generation | on | off (optional) | off | off | wasm |
| dev-proto  | Explore vocabulary | on | on | off | off | wasm/webgl |
| prod-pinched | Precision pinch | on | off | opt | off | wasm/webgl |

Custom Pinch Metric (Recap)

```ts
const d = (a,b) => Math.hypot(a.x-b.x, a.y-b.y); // 2D; extend with z if stable
const K = d(kpts[5], kpts[17]); // span
const D = d(kpts[4], kpts[8]);  // pinch distance
const P = K > 0 ? D / K : Infinity; // normalize
```
Maintain ring buffer of recent P to derive dP/dt and detect approach vs recede; feed hysteresis.

Time‑Of‑Impact (TOI) Lookahead (Option)

- Estimate linear approach: project when P will cross T_enter using current velocity (dP/dt).
- If projected crossing is within debounce window and velocity stable, promote Possible→Pinch early.
- Deterministic: avoid randomization; clamp extreme velocities.

Incorporating Built‑In Gestures

- Use as coarse context flags (e.g., ‘open hand’ vs ‘fist’) to label interaction mode, NOT as direct pinch trigger.
- Gate certain FSM transitions: e.g., only evaluate pinch if gesture layer reports ‘open’ and not ‘fist’.
- Record gesture labels alongside frames for later analytics.

Risk Table

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Model drift between releases | Silent FSM behavior shifts | Freeze + manifest verify + distribution diff script |
| Latency jitter live vs offline | Perceived inconsistency | Normalize metrics via same math; measure live |
| Gesture false positives | Unstable UX | Hysteresis + palm normal gating + min dwell |
| Version upgrades of Human | Hidden heuristic change | Dedicated upgrade PR with comparative report |
| Over-enabling models | Perf regressions | Profile & keep minimal config per mode |

Next Implementation Steps

1. Add lightweight PinchFSMRunner consuming JSONL + producing events.
2. Implement metric ring buffer + hysteresis + TOI optional projection.
3. Add schema for emitted events (enter, sustain, exit, predicted_enter).
4. Write golden event traces & freeze them similar to landmarks.
5. Regression test: landmark trace -> event trace diff must be empty vs frozen.

Governance Notes

- Only change Human version with a dedicated “Model Update” PR including before/after pinch metric distribution & event timing diffs.
- Keep separate golden sets for: (a) landmark raw, (b) derived events.
- Add script: compute distribution of P and dwell times; store summary JSON for diffing.
- Document supported config profiles in README to avoid accidental model enabling.

Example Event Schema (Draft)

```ts
type PinchEvent =
  | { type: 'pinch_enter'; frame: number; t: number; P: number }
  | { type: 'pinch_update'; frame: number; t: number; P: number }
  | { type: 'pinch_exit'; frame: number; t: number; P: number }
  | { type: 'pinch_predicted_enter'; frame: number; t: number; projectedFrame: number; confidence: number };
```

End.

Custom Gesture Extension Pattern
1. Identify stable keypoints & metrics (distances, angles, relative ordering).
2. Define threshold + hysteresis pairs per gesture (enter/exit) to reduce chatter.
3. Package as pure function: `(frameState) => { label, confidence }`.
4. Optionally wrap multiple detectors → aggregate highest confidence or multi-label set.
5. Log decisions (metrics + thresholds) for regression diffing.

Gesture Authoring vs Built‑In
- Human does not expose a GUI “gesture creator”; extension is code/heuristics.
- You can layer your own detector after `human.detect()` using result keypoints; keep it stateless per frame unless you manage history.

Data & Replay Contract (Aligned with Golden Master doc)
- Input frame object: `{ frameIndex, timestampMs, hands: [{ handedness, landmarks: [{x,y,z}] }] }`.
- Derived event: `{ tMs, type: Strike|Lift, velocity, confidence }`.
- Future: optional `{ gestureLabels: [...], poseMeta }` for richer analytics.

Determinism Checklist
- Pin @vladmandic/human version.
- Local model files with checksums.
- Fixed fps & timestamp formula.
- Disable internal filters; no smoothing at extraction.
- Single backend (wasm) for goldens.
- No dynamic resizing (fixed canvas dims).

When to Enable Extra Models
- Body: Only if you need arm orientation gating or future multi-gesture combos.
- Face: Only if expressions or gaze become a gating signal.
- Gesture: During exploratory phases to expand vocabulary quickly; disable in strict CI goldens.

Risks & Mitigations
| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Backend drift alters numerics | Golden mismatch | Lock backend + version; verify sha256 of models |
| Gesture false positives | Spurious FSM transitions | Keep gesture advisory-only for pinch path |
| Latency jitter live vs offline | Perceived inconsistency | Normalize metrics via same math; measure live | 
| Model update shifts keypoint ordering | Break calculations | Version pin & checksum; add schema test for index map |

Next Steps
1. Add lightweight PinchFSMRunner consuming JSONL + producing events.
2. Optional gesture label recording (store alongside frames for analytics).
3. Implement TOI lookahead & measure improvement in perceived responsiveness.
4. Evaluate enabling body model for orientation gating (only if a real UX need emerges).

Update Policy
- Only change Human version with a dedicated “Model Update” PR including before/after pinch metric distribution & event timing diffs.

Reference Snippet (Minimal Live Loop)
```ts
async function loop() {
  const res = await human.detect(video);
  const hand = res.hands?.[0];
  if (hand?.keypoints?.length >= 21) {
    const k = hand.keypoints; // ensure consistent ordering
    // compute pinch metric P here ...
  }
  requestAnimationFrame(loop);
}
loop();
```

End.