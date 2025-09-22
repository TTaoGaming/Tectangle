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

# Tectangle — Logic Reuse Rollup (algorithms, contracts, recipes)

Timestamp: 2025-09-12

## map (one line)

camera → landmark:raw → landmark:smoothed → kinematic clamp → pinch FSM → quantization/keyboard/visual/recording; telemetry/watchdog observe; registry wires.

## canonical data shapes

- Envelope: { ts:number, manager:string, event:string, frameId?:number, detail:object, tags?:object }
- LandmarkRaw: { landmarks: `number[21][3]`, frameId, timestamp, width, height, config, handsCount }
- LandmarkSmoothed: { landmarks: `number[21][3]`, frameId, timestamp, width, height, meta:{ source:'smoothed', alpha, modes:{ oneEuro:boolean } } }

## One Euro filter (implemented)

Per-scalar low-pass with derivative-adaptive cutoff; apply per axis (x,y,z) per keypoint.

- Derivative filter: aD = 1/(1 + (1/(2π dCutoff))/dt)
- dxHat = aD*dx + (1-aD)*dxPrev
- Cutoff: fc = minCutoff + beta*|dxHat|
- Value alpha: a = 1/(1 + (1/(2π fc))/dt)
- xHat = a*v + (1-a)*xPrev

Notes: Warm start with xPrev=v to avoid first-frame transients; clamp dt to 1/60 when invalid.

## Constant-velocity Kalman (recipe)

Target: optional prediction for fingertip axes; per-axis filter (x,y,z) with 2D state.

- State: s=[p v]^T, F=[[1 dt],[0 1]], H=[1 0]
- Process noise: Q=[[σp^2 0],[0 σv^2]] (σv via tuned accel)
- Measurement noise: R=[σm^2]
- Predict: s=F s; P=F P F^T + Q
- Update: y=z - H s; S=H P H^T + R; K=P H^T S^-1; s=s+K y; P=(I-KH)P

Params (start): σm=0.01, σv=0.05; run per point/axis; expose predictionMs to roll forward p+=v*(predictionMs/1000).

## Kinematic plausibility clamp (implemented)

- Hand scale: handScale = ||wrist(0) - middle_mcp(9)|| (fallback > 1e-6)
- For fingertips i∈{4,8,12,16,20}:
  - d = ||curr - prev||
  - normDist = d / handScale
  - dt (s) from timestamps; normSpeed = normDist/dt
  - Violation if normDist > teleportThreshold or normSpeed > maxSpeed
- Aggregate: if violations ≥ minFingertipViolations within aggregationWindowMs → emit plausibility:physics.fail; else pass and emit landmark:clamped.

## Palm orientation gate (recipe)

- Choose three points: wrist(0), index_mcp(5), pinky_mcp(17).
- Palm normal n = normalize((5-0) × (17-0)).
- Camera vector c ≈ (0,0,-1) if MP z forward; palmFacingScore = dot(n, -c).
- Gate pass if palmFacingScore ≥ threshold and mean velocity ≤ maxSnapshotVelocity (for snapshots).

## Absolute scale calibration (Phase‑0 intent)

- Input: controllerId, physicalKnuckleCm (user-provided).
- Measurement: normalizedDistance = ||index_mcp(5) - pinky_mcp(17)|| in [0..√2].
- scaleCm = physicalKnuckleCm / max(ε, normalizedDistance).
- Persist scope key: { deviceId, cameraPose, controllerId } ⇒ { scaleCm, lastMeasurement, snapshots:[{zProxy, normalizedDistance, scaleCm}] }.
- Z‑slices: near/primary/far snapshots; interpolate scale by zProxy.

## Pinch FSM (implemented minimal)

- States per controllerId,finger: idle ↔ triggered.
- Metrics: thumb(4)↔tip distance normalized by palmSpan = ||index_mcp(5) - pinky_mcp(17)||.
- Transitions:
  - idle→triggered: norm ≤ triggerRatio
  - triggered→idle: norm ≥ releaseRatio
- Emits tectangle:gesture { type:'start'|'end', controllerId, finger, normalizedDistance, frameId, ts }.
- Extend: add held with holdMs timer; emit 'hold' and adapter:mapped_key.

## Quantization (recipe)

- Grid: beatMs = 60000/bpm; swing: shift odd beats by swing*beatMs/2.
- Humanize: jitter in [−humanizeMs, +humanizeMs] using seeded RNG.
- Quantize: q = round((ts+offset)/beatMs)*beatMs + swingAdjust + humanize.
- Emit tectangle:gesture with quantizedTs and metadata.

## Tracking association (implemented minimal)

- Centroid of landmarks.
- Greedy nearest neighbor between detections and existing tracks under distance threshold; create/retire with maxAgeFrames.

## Telemetry (intent)

- Record canonical envelopes with low-PII: { ts, manager, event, frameId, tags, summary }.
- Export to window.__tectangleTelemetry; optional sink hook (download/log/JSONL).

## Contracts (reusable)

- Frame: { frameId, timestamp, width, height }
- Landmarks: `number[N][3]` normalized image coords; z relative.
- Smoothed: same shape + meta.oneEuro params.
- Clamped: { pass:boolean, clampedIndices:number[], reason?:string }
- Gesture: { type:'start'|'hold'|'end', controllerId, finger, normalizedDistance, frameId, ts }

## tiny pseudocode snippets

OneEuro per axis:

```js
class OneEuro { constructor(p){ this.p=p; this.x=null; this.dx=0; this.t=null; this.prevRaw=null; }
  alpha(cut,dt){ const tau=1/(2*Math.PI*cut); return 1/(1+tau/dt); }
  filter(v,t){ if(this.t==null){ this.x=v; this.t=t; this.prevRaw=v; return v; }
    let dt=(t-this.t)/1000; if(!(isFinite(dt)&&dt>0)) dt=1/60;
    const dx=(v-this.prevRaw)/dt; const aD=this.alpha(Math.max(1e-6,this.p.dCutoff),dt);
    const dxHat=aD*dx+(1-aD)*this.dx; const cut=this.p.minCutoff+this.p.beta*Math.abs(dxHat);
    const a=this.alpha(Math.max(1e-6,cut),dt); const xHat=a*v+(1-a)*this.x;
    this.x=xHat; this.dx=dxHat; this.prevRaw=v; this.t=t; return xHat; }
}
```

Kalman per axis:

```js
class Kalman1D { constructor({q=1e-3,r=1e-2}){ this.s=[0,0]; this.P=[[1,0],[0,1]]; this.q=q; this.r=r; this.t=null; }
  step(z,t){ const dt=this.t?Math.max(1/60,(t-this.t)/1000):1/60; this.t=t;
    const F=[[1,dt],[0,1]], H=[1,0];
    // predict
    let [p,v]=this.s; p=p+v*dt; let P=this.P;
    const Q=[[this.q,0],[0,this.q]]; // simple
    P=matAdd(matMul(F,matMul(P,matT(F))),Q);
    // update
    const y=z-(H[0]*p+H[1]*v); const S=H[0]*(P[0][0]*H[0]+P[0][1]*H[1])+H[1]*(P[1][0]*H[0]+P[1][1]*H[1])+this.r;
    const K=[(P[0][0]*H[0]+P[0][1]*H[1])/S,(P[1][0]*H[0]+P[1][1]*H[1])/S];
    p=p+K[0]*y; v=v+K[1]*y; const I=[[1,0],[0,1]]; const KH=[[K[0]*H[0],K[0]*H[1]],[K[1]*H[0],K[1]*H[1]]];
    this.P=matMul(matSub(I,KH),P); this.s=[p,v]; return p; }
}
```

## first reversible slice

- Adopt: keep current OneEuro smoothing + clamp + pinch; expose TelemetryManager scaffold to export JSONL (low-PII).
- Adapt: optional Kalman per-axis behind a flag; A/B compare meanDownLatency vs. overshoot.
- Invent: palm gate score + z‑slice calibration snapshots (three-bucket) persisted per controller.

## wiring hints

- EventBus canonical publishes (publishFrom) with manager source; tests assert shape.
- ManagerRegistry createAllFromWiring + runLifecycle for deterministic start order.
- Keep adapters (MediaPipe/Human) behind LandmarkRawManager config; downstream logic remains unchanged.
