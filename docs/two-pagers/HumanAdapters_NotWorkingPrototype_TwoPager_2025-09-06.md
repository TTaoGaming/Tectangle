HumanAdapters — Not Working Prototype (Status & Next Steps)
===========================================================

Metadata
--------

- title: HumanAdapters — Not Working Prototype (Status & Next Steps)
- doc_type: two-pager
- timestamp: 2025-09-06T00:00:00Z
- tags: [Human, adapters, wasm, webgl, puppeteer, tdd, replay, hand-landmarks]
- summary: Snapshot of the current prototype status (red), why it’s failing, and the minimal steps to turn it green using TDD.

Page 1 — What we built vs. what “done” means
--------------------------------------------

Goal (acceptance, from product intent)

- One URL shows a dual view:
  - Left: upstream Human demo in an iframe (as-is).
  - Right: our adapter pane with camera/video and two dots drawn on index (8) and thumb (4) tips.
- Must work the same for Webcam and two local MP4s (4s and 6s clips).
- Adapter must output normalized landmarks [0..1].
- Clean console; no 404s for models; ≥20 FPS.

What exists (three adapter prototypes)

- Option A — Direct ESM: import Human ESM, run detect(video), draw tips.
- Option B — Observer: read `human.result` from demo iframe, draw tips.
- Option C — Worker: send ImageBitmap frames to a Worker running Human, draw tips on main thread.

TDD harness

- jest + puppeteer headless, static server on :8080.
- Red tests added to assert:
  - Dual view DOM exists.
  - MP4s render overlay pixels (dots).
  - Debug hook `window.__lastHands` exists and contains normalized [0..1] landmarks with ≥21 points.

Current status (red)

- All three prototypes fail both MP4 tests (no dots, no normalized landmarks observed in headless runs).
- Webcam case is skipped in CI for determinism.

Why it’s not working (root causes)

1) TFJS WASM assets not found in headless

- We forced `backend:'wasm'` but did not vendor tfjs-wasm binaries under a served path; `wasmPath` points to a folder that doesn’t exist → no inference → hands=[].

1) Observer lacks exported instance

- Option B requires the demo to export `window.__human` (e.g., via `?export=true`). The upstream demo hasn’t been modified → cannot read results → no hands.

1) Draw/overlay coupling was added but detection returns empty

- Even with a visible canvas, without detections the overlay remains blank; pixel heuristics stay false.

Constraints to keep in mind

- Headless Chrome can be brittle with WebGL; WASM is preferable but requires local binaries.
- Same-origin is required to observe the demo iframe safely.
- Local models live at `/human-main-referenceonly/human-main/models` and must be referenced via `modelBasePath`.

Page 2 — How to turn it green (minimal plan)
--------------------------------------------

Fastest path (P0) — WebGL fallback for tests

- Option A & C: switch `backend` to `'webgl'` in CI/tests; remove invalid `wasmPath` so TFJS doesn’t try to fetch non-existent WASM.
- Keep `modelBasePath: '/human-main-referenceonly/human-main/models'`.
- Re-run tests on the two MP4s; expect dots to render and `__lastHands` to be populated (we normalize to [0..1] in the adapter regardless of source coords).

Deterministic path (P1) — Vendor WASM locally

- Place tfjs-wasm binaries in a served folder, e.g., `/vendor/tfjs-wasm/`:
  - `tfjs-backend-wasm.wasm`
  - `tfjs-backend-wasm-simd.wasm`
  - `tfjs-backend-wasm-threaded-simd.wasm`
- Set `wasmPath: '/vendor/tfjs-wasm/'` in Option A & C; keep `backend:'wasm'`.
- Re-run headless tests; this is more stable across machines/CI.

Observer enablement (Option B)

- If allowed, add a tiny opt-in in the demo (same-origin):
  - When `?export=true`, run `window.__human = human;` after demo initializes.
- Alternatively, inject a shim script into the iframe if we control hosting. If neither is allowed, mark B as manual-only and exclude from CI.

Worker robustness (Option C)

- Keep posting `ImageBitmap` frames; add a simple backpressure gate (drop when worker busy) to avoid queue growth.
- Optionally use OffscreenCanvas for future speed-ups (not required for passing tests).

Definition of Done (for these prototypes)

- Tests green on both MP4s:
  - Dual view present, overlay shows dots.
  - `window.__lastHands` exists and is normalized [0..1], ≥21 points.
  - No 404s under `/models`; console warnings limited to autoplay.

Test matrix to add next (from architecture two-pagers)

- Unit: HumanAdapter normalization; missing landmark policy; palm gate polarity.
- Metrics: P, dP/dt; K≈0 guard.
- FSM: hysteresis, debounce, Anchored hold; no Strike when gate=false.
- Integration: ReplayAdapter → Core → EventsOut with events goldens.
- Performance: budget assertions per device profile.
- Live smoke: kpCount=21 badge; backend string; coordMode=normalized.

Decisions & owners

- Backend for CI: P0 use WebGL fallback → revisit to WASM once vendor path is set.
- Option B in CI: gated behind `?export=true` or skipped.
- Ownership: Adapter + Tests (you); Demo export (opt-in change) if permitted.

Prompts to use

- “Flip Option A/C to backend='webgl' for e2e only, keep modelBasePath, and re-run tests.”
- “Vendor tfjs-wasm under /vendor/tfjs-wasm/ and set wasmPath accordingly; keep backend='wasm' in CI.”
- “Add `?export=true` to the demo to set window.__human for observer testing.”

ETA to green

- P0 fallback: ~30–60 minutes.
- P1 deterministic WASM: ~60–90 minutes (after placing binaries).

End.
