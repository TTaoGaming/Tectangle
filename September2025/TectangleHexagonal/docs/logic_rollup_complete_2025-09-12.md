<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Validate references against knowledge manifests
- [ ] Log decisions in TODO_2025-09-16.md
-->

# Tectangle — Complete Logic Rollup (Architecture Knowledge Index)

Timestamp: 2025-09-12
Scope: Past 6 months prototypes and notes; consolidates into reusable logic + contracts

## purpose

- Consolidate core logic (filters, FSMs, calibration, gating, clamp, quantization, tracking)
- Normalize data contracts and event seams
- Map prior prototypes/stacks to current pipeline (Hex-compatible ports/adapters)
- Produce an adoptable, reversible plan for rollout

## sources (catalog)

- Knowledge backup 20250912
  - 4R_REFERENCE_20250417.md — requirements/risks/roadmap/rules
  - 4_RECTANGLE_GUIDE.md — UI/system framing
  - Consolidated_Pinch_Report_2025-09-06_FINAL.md — pinch tuning
  - FOUNDATION_COLLIDING_SPHERE_SUMMARY.md — physics/kinematic ideas
  - HTML_LIT_REFERENCE_20250417.md — UI references
  - index-modular-monolithv25.7.26.1730.html — July modular monolith index
  - mdp90a_REFERENCE_20250417.md, MDP_REFERENCE_20250417.md — model/dev policy
  - MDP_AI_CODING_GUIDE.md — coding guide
  - modular-blueprint.md — modularization plan
  - REACT_REFERENCE_20250417.md — React references
  - TECTANGLE_AUDIO_GESTURE_STUDIO_EARS.md — audio/gesture EARS

## one-line map

camera → landmark:raw → landmark:smoothed → kinematic clamp → palm gate → pinch FSM → quant/keyboard/visual/recording; telemetry/watchdog observe; registry wires

## canonical contracts (reusable)

- Envelope: { ts:number, manager:string, event:string, frameId?:number, detail:object, tags?:object }
- Frame: { frameId:number, timestamp:number, width:number, height:number }
- LandmarksRaw: { landmarks: `number[21][3]`, frameId, timestamp, width, height, config, handsCount }
- LandmarksSmoothed: { landmarks: `number[21][3]`, frameId, timestamp, width, height, meta:{ source:'smoothed', alpha, modes:{ oneEuro:boolean } } }
- Clamped: { pass:boolean, clampedIndices:number[], reason?:string }
- Gesture: { type:'start'|'hold'|'end', controllerId:number, finger:string, normalizedDistance:number, frameId?:number, ts:number }

## core algorithms (extract + ready-to-adopt)

### One Euro smoothing (implemented)

- Per-scalar low-pass with derivative-adaptive cutoff; apply per (x,y,z) for each keypoint.
- aD = 1/(1 + (1/(2π dCutoff))/dt); dxHat = aD*dx + (1-aD)*dxPrev
- fc = minCutoff + beta*|dxHat|; a = 1/(1 + (1/(2π fc))/dt); xHat = a*v + (1-a)*xPrev
- Notes: warm-start xPrev=v; clamp dt→1/60 when invalid; presets {Responsive, Balanced, Smooth}.

### Constant-velocity Kalman (recipe)

- State s=[p v]^T; F=[[1 dt],[0 1]]; H=[1 0]
- Q from process accel; R from meas noise; predict/update per axis; optional predictionMs roll-forward.
- Start: σm=0.01, σv=0.05; run per point/axis; behind feature flag.

### Kinematic plausibility clamp (implemented)

- handScale = ||wrist(0) - middle_mcp(9)|| (≥1e-6)
- fingertips i∈{4,8,12,16,20}: d=||curr-prev||; normDist=d/handScale; normSpeed=normDist/dt
- Violation if normDist > teleportThreshold or normSpeed > maxSpeed
- Aggregate ≥ minFingertipViolations in aggregationWindowMs → plausibility:physics.fail; else landmark:clamped pass

### Palm orientation gate (recipe)

- n = normalize((index_mcp(5)-wrist(0)) × (pinky_mcp(17)-wrist(0)))
- c ≈ (0,0,-1) if z forward; palmFacingScore = dot(n, -c)
- Pass if score ≥ threshold and mean velocity ≤ maxSnapshotVelocity (for snapshots)

### Absolute scale (Phase‑0 intent)

- Input: controllerId, physicalKnuckleCm (user)
- normalizedDistance = ||index_mcp(5)-pinky_mcp(17)||
- scaleCm = physicalKnuckleCm / max(ε, normalizedDistance)
- Persist per {deviceId,cameraPose,controllerId}; z-slice snapshots {near,primary,far} then interpolate by zProxy

### Pinch FSM (implemented minimal)

- Per controllerId,finger state: idle ↔ triggered
- Metric: thumb(4)↔tip distance / palmSpan (=||5-17||)
- idle→triggered if norm ≤ triggerRatio; triggered→idle if norm ≥ releaseRatio; add hold via holdMs
- Emits tectangle:gesture with fields above

### Quantization (recipe)

- beatMs = 60000/bpm; swing shift; humanize via seeded RNG in ±humanizeMs
- Quantize: q = round((ts+offset)/beatMs)*beatMs + swingAdjust + humanize

### Tracking association (implemented minimal)

- Centroid; greedy nearest neighbor within threshold; create/retire with maxAgeFrames

### Telemetry + Watchdog (intent)

- Low-PII: { ts, manager, event, frameId, tags, summary } appended to window.__tectangleTelemetry; sink hooks (JSONL)
- Watchdog validates envelope shape/registration; emits watchdog:violation in alert-only mode

## pipeline mapping (prior → current)

- Acquisition: MediaPipe (VIDEO/IMAGE) today; Human adapter planned → same LandmarksRaw contract
- Smoothing: One Euro on by default; optional Kalman toggle for A/B
- Clamp + Palm gate: clamp first, gate pinch decisions; snapshot gating for calibration
- Pinch: FSM emits tectangle:gesture; Quantization optional; Keyboard/Visual adapters consume
- Tracking/Predictive: placeholders ready to adopt; keep contracts stable

## tech-stack crosswalk (agnostic via ports/adapters)

- Browser ESM + CDN (MediaPipe) → LandmarksRaw
- Node smoke (deterministic synthetic) → same contract
- UI frameworks (React/Lit): integrate via EventBus; do not couple domain
- Overlay (Three.js/canvas): consume tectangle:gesture and smoothed landmarks

## decisions (why)

- OneEuro first: minimal deps, stable on phones, low overshoot; Kalman gated behind flag
- Image-sequence path for CI: deterministic, avoids headless MP4 fragility
- Hex ports: keep domain pure, swap sources/adapters without drift

## migration plan (reversible slices)

1) Adopt contracts: freeze Envelope/Landmarks/Smoothed/Clamped/Gesture in docs + code comments
2) Add TelemetryManager scaffold to export JSONL (low-PII) from current events
3) Add optional Kalman toggle in LandmarkSmoothManager; surface params; default off
4) Implement palm gate util + gate in PinchRecognitionManager with threshold param
5) Wire AbsoluteScaleManager Phase‑0 numeric entry + snapshot stubs; persist per device/pose/controller
6) Generate knowledge manifest JSON for backup sources; link in index; tag sections to logic areas

## acceptance checkpoints

- Unit: eventbus normalization; smoothing presets; clamp pass/fail; pinch FSM transitions
- Smoke: frames→JSONL artifacts (pinch/gated) stable across runs
- Lint/docs: contracts present in headers; docs build clean

## appendix A — tiny pseudocode

OneEuro per axis (see LandmarkSmoothManager):

```js
class OneEuro { /* params + alpha + filter(v,t) as implemented */ }
```

Kalman per axis (recipe):

```js
class Kalman1D { /* s=[p,v], P, step(z,t) with predict/update */ }
```

## status links

- Existing: docs/logic_reuse_rollup_2025-09-12.md (algorithms/cookbook)
- Index: docs/knowledge_logic_rollup_index_2025-09-12.md (sources + first slice)

## next

- Generate docs/knowledge_manifest_2025-09-12.json (title,tags,date,intent per file) and link from index
- Add TelemetryManager scaffold + minimal test (normalize + export window)
