HumanAdapter — Simple Options & Root Cause (Why No Dots?)
=========================================================

Metadata
--------

- title: HumanAdapter — Simple Options & Root Cause (Why No Dots?)
- doc_type: two-pager
- timestamp: 2025-09-06T00:00:00Z
- tags: [Human, hands, adapter, models, modelBasePath, iframe, COOP/COEP, prompts]
- summary: Three simple ways to get normalized hand landmarks from Human without forking the demo, plus the real root causes behind “camera but no visuals,” and how to prompt to get this right on the first pass.

Page 1 — The 3 simplest adapter options (and tiny contracts)
------------------------------------------------------------

Goal

- Keep the upstream Human demo as-is on the left.
- On the right, run a minimal adapter that: takes a camera frame → returns normalized 21-point landmarks per hand.
- Disable Face; keep Hand on; keep Gesture on; Body optional.

Option A — Direct ESM Adapter (recommended P0)

- What: Your page imports Human’s ESM build, creates a Human instance with only the needed models, sets modelBasePath to your local models, and runs detect(video) in a simple loop. No workers, no iframe coupling.
- Why it’s best: Few moving parts, no modification to demo, easy to debug (Network/Console show model fetches, errors).
- Tiny contract
  - Inputs: HTMLVideoElement | OffscreenCanvas (from getUserMedia)
  - Config: { backend: 'webgl', worker: false, face: {enabled:false}, gesture:{enabled:true}, hand:{enabled:true}, body:{enabled:false|true}, modelBasePath: '/human-main-referenceonly/human-main/models' }
  - Output: { hands: [{ landmarks: [{x,y,z?} x21] }...] } where x,y are normalized [0..1]

Option B — Same-Origin Observer of Demo (no fork; 1-liner export in demo if allowed)

- What: If same-origin, the demo can expose its `human` instance (e.g., window.__human = human). Your page then reads `__human.result.hands` on rAF. If you must keep demo 100% untouched, this option becomes a “strangler-fig” that lightly patches only when a `?export=true` flag is present.
- Why: Reuse demo’s camera + settings. Minimal logic on your page (just draw dots). No second model load.
- Tiny contract
  - Inputs: window.__human.result (read-only)
  - Output: same normalized landmarks; your adapter normalizes if demo returns pixel coords.
  - Note: Requires either a tiny opt-in change in demo or a bridging script. If not acceptable, use Option A.

Option C — Worker Adapter (isolate detection; main thread draws dots)

- What: Put Human in a Web Worker (or SharedWorker) and postMessage frames (ImageBitmap). Worker returns normalized landmarks. Main thread draws dots. Use only if you need UI smoothness under heavy load.
- Why: Smoothens UI; scales to more logic later. More moving parts and COOP/COEP if you enable some backends, so not P0.
- Tiny contract
  - Inbound: { frame, width, height }, Outbound: { hands: [...] } normalized
  - Constraint: Avoid workers unless you control COOP/COEP headers or stick to backend='webgl' with worker=false.

Acceptance definition (what “done” looks like)

- Open a single URL and see: Left = Human demo with overlays; Right = camera feed with two dots (thumb tip=4 cyan, index tip=8 lime) tracking at ≥20 FPS; Console clean; Network shows no 404s under /models.

Page 2 — Root cause analysis (3× sequential thinking) and prompts
------------------------------------------------------------------

Why you saw “camera view but no visuals”

1. Missing modelBasePath in the custom pane (highest-likelihood)

- Evidence in repo: Human types expose `modelBasePath` (types/human.d.ts). Human loads models via `src/tfjs/load.ts` by joining modelBasePath + modelPath; default `''` causes fetches relative to dist.
- Your models actually live at `/human-main-referenceonly/human-main/models/` (confirmed). Without setting modelBasePath, model fetches 404 → `hands=[]` → dots never draw.

1. Worker/COOP/COEP and backend toggles mismatched between panes

- If `worker=true` but your server lacks COOP/COEP headers, Worker-based processing is restricted. The demo handles this path better; the custom pane may silently downgrade or choke. Using `backend='webgl'` and `worker=false` avoids it.

1. Overlay scaffolding gaps (canvas size/z-index/DPR)

- Even with detections, a zero-sized overlay, canvas behind the video, or not accounting for devicePixelRatio can look like “no dots.” The demo has a robust draw stack; the custom pane needs a minimal equivalent.

Sequential thinking — 3 passes (MCP)

Pass 1: Hypothesis from symptoms

- Symptom: Right pane shows camera but no dots, while left demo is fine.
- Hypothesis: Right pane detects nothing (hands=[]). The most probable cause is missing model fetches (404) due to unset modelBasePath.

Pass 2: Check repo and API surface

- Search results (grounding):
  - models exist at `/human-main-referenceonly/human-main/models` (list_dir confirms).
  - `modelBasePath` is a top-level config field (types/human.d.ts) and used by loader (src/tfjs/load.ts join). Tests set `modelBasePath: 'file://models/'` in Node paths.
  - So, without setting it in your custom page, model URLs are wrong relative to the ESM path.

Pass 3: Operational implications & fixes

- Set `modelBasePath` exactly to `/human-main-referenceonly/human-main/models`. Keep `backend='webgl'`, `worker=false` to avoid COOP/COEP. Disable `face` for perf; keep `hand` and `gesture` on; `body` optional. Ensure overlay canvas sits above video and matches its dimensions, scaling by `devicePixelRatio` when drawing.

Debug checklist (90 seconds)

- Network: No 404s under /human-main-referenceonly/human-main/models/*.json|.bin
- Console: No worker/COOP/COEP warnings; no CORS errors
- Human state: In DevTools, log `human.result.hands.length` — must be > 0 with a visible hand
- Overlay: Canvas width/height equals drawn frame; z-index above video; consider `ctx.scale(devicePixelRatio, devicePixelRatio)`
- Performance: If FPS < 15, reduce right pane camera constraints (e.g., 640×360)

Prompting guide (so we hit first pass)

Provide this in one message next time:

- “Create page at /September2025/HumanDualView/index.html. Left: iframe /human-main-referenceonly/human-main/demo/index.html?backend=webgl&worker=false. Right: our adapter importing /human-main-referenceonly/human-main/dist/human.esm.js. Config: face:false, gesture:true, hand:true, body:false, modelBasePath:'/human-main-referenceonly/human-main/models'. Output: normalized landmarks [0..1]. Draw only 2 dots (tip 4 cyan, tip 8 lime). Success: ≥20 FPS, no console errors, no model 404s.”

Regression syndrome (why this felt harder than “just draw two dots”)

- The demo bundles camera, model paths, draw stack, and performance tuning. A bare page needs to recreate just enough of that: a correct `modelBasePath`, a draw overlay, and a stable backend.
- Failure is quiet: you still see video even if models don’t load. The only tell is 404s in Network and `hands.length === 0`.
- Running demo + custom detection simultaneously can stress the GPU/CPU. If needed, downscale the right pane video.

What you’re not doing wrong

- Asking for a simple adapter is reasonable; the key missing lever was the asset path and a few runtime toggles (backend/worker) that the demo hides for you.

Quick decision table

- Need fast, robust result today → Option A (Direct ESM Adapter).
- Want zero second model load and reuse demo camera → Option B (Observer), if a tiny opt-in export is allowed.
- Need UI smoothness under load or future concurrency → Option C (Worker), with known COOP/COEP tradeoffs.

End.
