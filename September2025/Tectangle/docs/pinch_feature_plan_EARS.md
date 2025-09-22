# Pinch Feature Plan — EARS additions (compact)

Source-of-truth references:
- [`September2025/Tectangle/diagnostics/triage/triage-report.md`](September2025/Tectangle/diagnostics/triage/triage-report.md:1)
- [`September2025/Tectangle/src/gesture/pinchBaseline.js`](September2025/Tectangle/src/gesture/pinchBaseline.js:1)
- [`September2025/Tectangle/src/gesture/pinchFeature.js`](September2025/Tectangle/src/gesture/pinchFeature.js:1)
- [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:1)

EARS requirements (single‑sentence + notes + defaults)

1) EARS: The runtime MUST assign and persist a stable controllerId (handId) per tracked hand so pinch events do not teleport between hands across brief landmark loss or re-detection.

Implementation note: score new hand detections against active controller slots using weighted features (centroid, palmDir/palmQuat, handedness); assign best match if score ≥ matchThreshold else open a new controller slot; expire controllers after deathTimeoutMs.  
Default: matchThreshold = 0.60; deathTimeoutMs = 400 ms; weights = { centroid:0.5, palmDir:0.3, handedness:0.2 }.

2) EARS: When depth (3D) is available compute a wrist→middle-finger quaternion to represent palm orientation for gating and smoothing; when depth is unavailable fall back to a 2D palm direction vector and quantize it for stable gating.

Implementation note: compute quaternion from wrist→middle and wrist→palmNormal vectors (normalize, form orthonormal basis, convert to quaternion); if depth confidence < minDepthConfidence compute 2D palmDir angle and quantize to angleBins for smoothing and matching.  
Default: minDepthConfidence = 0.5; angleBins = 8 (45° bins).

3) EARS: Predicted time‑of‑impact (TOI) MUST be quantized to a configurable musical grid (BPM + subdivision) before scheduling synth/key events so touch timing locks to musical time.

Implementation note: compute raw TOI from relative speed/distance, then quantize to nearest tickMs = 60000 / BPM / subdivision; if quantized delta > maxQuantizeMs fall back to raw TOI to avoid long delays.  
Default: BPM = 120; subdivision = 4 (ticks per beat); maxQuantizeMs = 200 ms.

Plain‑language runtime flow

hand tracking → controllerId matching → quaternion (3D) / 2DDir (fallback) → per-channel smoothing (OneEuro) → palm gating (cone/dir test) → compute normalized distance → hysteresis & kinematic clamp → TOI prediction → TOI quantization (musical grid) → FSM evaluation → emit pinch events (pinch:down/up) → schedule synth/key synthesis (quantized timing).

Concise pseudocode snippets

[`javascript.declaration()`](September2025/Tectangle/src/gesture/pinchFeature.js:1)
```javascript
// controller matching (predict + score + assign)
for (D of detections) {
  scores = controllers.map(c => scoreMatch(c, D, weights));
  if (max(scores) >= matchThreshold) assignTo(bestController); else createController(D);
  controller.lastSeen = now;
}
```

[`javascript.declaration()`](September2025/Tectangle/src/gesture/pinchFeature.js:1)
```javascript
// wrist → middle quaternion (3D) with 2D fallback quantize
if (depthConf >= minDepthConfidence) palmQuat = quatFromBasis(norm(wrist->middle), norm(wrist->palmNormal));
else { palmDir2D = normalize(vec2(palm.x - wrist.x, palm.y - wrist.y)); palmDirBin = round(angle(palmDir2D) / (2*Math.PI/angleBins)); }
```

[`javascript.declaration()`](September2025/Tectangle/src/gesture/pinchFeature.js:1)
```javascript
// TOI quantize to nearest beat tick
tickMs = 60000 / BPM / subdivision;
quantTick = Math.round((now + toi) / tickMs) * tickMs;
quantizedDelay = Math.max(0, quantTick - now); if (quantizedDelay > maxQuantizeMs) quantizedDelay = toi;
scheduleSynth(now + quantizedDelay);
```

Controller/tracker defaults (recommended)

- matchThreshold: 0.60  
- deathTimeoutMs: 400  
- weights: { centroid: 0.5, palmDir: 0.3, handedness: 0.2 }  
- maxControllers: 2

[`json.declaration()`](September2025/Tectangle/src/gesture/pinchFeature.js:1)
```json
{
  "event": "pinch:down",
  "controllerId": "ctrl-1",
  "finger": "index",
  "anchor": { "x": 0.42, "y": 0.51, "z": 0.02 },
  "palmQuat": [0.707, 0, 0.707, 0],
  "palmDir": { "x": 0.0, "y": -1.0 },
  "quantizedAtMs": 1690000000000,
  "scheduledSynthAtMs": 1690000000100,
  "frameId": 12345,
  "ts": 1690000000000
}
```

Integration: Event emission uses the same EventBus pattern as the baseline — see [`September2025/Tectangle/src/gesture/pinchBaseline.js`](September2025/Tectangle/src/gesture/pinchBaseline.js:1) for example publishFrom(...) usage.

Acceptance checks

- EARS sentences for controllerId, quaternion fallback, and TOI quantization are present with implementation notes and numeric defaults.  
- Runtime flow includes controllerId matching and quantization steps.  
- Pseudocode snippets and example event payload (with controllerId + palmQuat/palmDir) included.  
- Doc is concise (<1200 words) and saved at the requested path.

---

Next: implement [`September2025/Tectangle/src/gesture/pinchFeature.js`](September2025/Tectangle/src/gesture/pinchFeature.js:1) and wire into bootstrap and tests per the main plan.