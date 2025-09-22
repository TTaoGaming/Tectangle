Pinch MVP Decision & Implementation Plan — Palm‑gated index↔thumb pinch (Pinch Piano MVP)

SUMMARY: Exploit — fix the src bootstrap so the existing deterministic pinchBaseline can be reused, wire a minimal palm‑gated index↔thumb pinch to synthesize in‑page key events, and ship a Pinch Piano demo for fast monetization.

CONTEXT / SOURCE OF TRUTH
- Triage that found an unguarded top-level await and Mocha import failure: [`September2025/Tectangle/diagnostics/triage/triage-report.md:1`](September2025/Tectangle/diagnostics/triage/triage-report.md:1)
- Mocha failure log (CJS in ESM): [`September2025/Tectangle/diagnostics/triage/mocha-output.txt:2`](September2025/Tectangle/diagnostics/triage/mocha-output.txt:2)
- Running prototypes: guarded quick-fixes recommended in [`September2025/Tectangle/prototype/landmark-smooth/index-src.html:224`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) and raw prototype: [`September2025/Tectangle/prototype/landmark-raw/index.html:1`](September2025/Tectangle/prototype/landmark-raw/index.html:1)
- Manager bootstrap implicated: [`September2025/Tectangle/prototype/common/manager-bootstrap.js:233`](September2025/Tectangle/prototype/common/manager-bootstrap.js:233)
- Deterministic pinch detector (baseline): [`September2025/Tectangle/src/gesture/pinchBaseline.js:40`](September2025/Tectangle/src/gesture/pinchBaseline.js:40)
- Telemetry scaffold: [`September2025/Tectangle/src/telemetry/pinchTelemetry.js:37`](September2025/Tectangle/src/telemetry/pinchTelemetry.js:37)
- Smoke test using golden trace: [`September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs:7`](September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs:7) and [`September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1`](September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1)

DECISION GRID

Explore
- Summary: Build instrumentation and collect more real-world traces (different phones/browsers/wrist poses) before committing thresholds, smoothing, or mapping.
- Impact: Medium
- Risk: Low
- Effort: days
- Concrete NextStep: Run extended capture using the existing prototypes (serve locally with `npx -y http-server ./ -p 8000 -c-1`) and collect telemetry; review traces in [`September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1`](September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1)

Exploit
- Summary: Fix the immediate src bootstrap problem so the smooth prototype wires UI, reuse [`September2025/Tectangle/src/gesture/pinchBaseline.js:40`](September2025/Tectangle/src/gesture/pinchBaseline.js:40) deterministic detector, and implement a small bridge that maps `pinch:down`/`pinch:up` to in‑page key events for Pinch Piano demo.
- Impact: High
- Risk: Medium
- Effort: minutes → 2 days (fast path: 1–4 hours; full QA + polish: 1–2 days)
- Concrete NextStep: Apply a guarded await in [`September2025/Tectangle/prototype/landmark-smooth/index-src.html:224`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224), add tolerant bootstrap changes in [`September2025/Tectangle/prototype/common/manager-bootstrap.js:233`](September2025/Tectangle/prototype/common/manager-bootstrap.js:233) if problems persist, and wire [`September2025/Tectangle/src/gesture/pinchBaseline.js:40`](September2025/Tectangle/src/gesture/pinchBaseline.js:40) into a small bridge (create [`September2025/Tectangle/prototype/demo/pinch-piano-bridge.js:1`](September2025/Tectangle/prototype/demo/pinch-piano-bridge.js:1)) that listens to `pinch:down`/`pinch:up` and dispatches in-page keyboard events.

Pivot
- Summary: Abandon current code surface and build a new small monolithic demo (single HTML+JS) that uses MediaPipe directly and implements the minimal palm-gated pinch detector and mapping.
- Impact: Medium
- Risk: Low→Medium (less integration risk, more duplication)
- Effort: 1–3 days (to build a robust demo with smoothing and mapping)
- Concrete NextStep: Clone [`September2025/Tectangle/prototype/landmark-raw/index.html:1`](September2025/Tectangle/prototype/landmark-raw/index.html:1) to a new monolith [`September2025/Tectangle/prototype/monolith-pinch/index.html:1`](September2025/Tectangle/prototype/monolith-pinch/index.html:1) and implement `pinchBaseline` logic inside the monolith and the pinch→key bridge.

Reorient
- Summary: Shift goals — implement external bridge (Electron/Tauri or WebMIDI) for system-level input and longer-term multi‑pinch mapping; postpone quick monetization demo.
- Impact: High (long-term)
- Risk: High
- Effort: days → weeks
- Concrete NextStep: Prototype a native bridge or WebMIDI shim and test proof-of-concept mapping outside the browser.

TopRightRecommendation
- RECOMMENDED: Exploit — fix the src bootstrap and ship Pinch Piano using the existing [`September2025/Tectangle/src/gesture/pinchBaseline.js:40`](September2025/Tectangle/src/gesture/pinchBaseline.js:40) and a tiny demo bridge. Justification: fastest path to a reliable in‑page mapping with minimal dev overhead and reuse of deterministic tests and golden trace (Confidence: 0.85).

PRIORITIZED IMPLEMENTATION PLAN (Exploit)

1 hour
- Implement quick guard around top-level await in [`September2025/Tectangle/prototype/landmark-smooth/index-src.html:224`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) so UI handlers attach even if CameraManager instantiation fails. Verify Start button responds in the browser served at `http://localhost:8000/` (use existing server: `npx -y http-server ./ -p 8000 -c-1`).
- Smoke test: run the deterministic smoke test against the golden trace with Node: `node --test tests/smoke/pinch.baseline.smoke.test.mjs` and confirm it emits pinch events or telemetry.

1 day
- Wire [`September2025/Tectangle/src/gesture/pinchBaseline.js:40`](September2025/Tectangle/src/gesture/pinchBaseline.js:40) into a tiny bridge [`September2025/Tectangle/prototype/demo/pinch-piano-bridge.js:1`](September2025/Tectangle/prototype/demo/pinch-piano-bridge.js:1) that listens for `pinch:down`/`pinch:up` and synthesizes page `keydown`/`keyup` for the demo; add a minimal UI to show active holds and mapping.
- Add small tolerant change in [`September2025/Tectangle/prototype/common/manager-bootstrap.js:233`](September2025/Tectangle/prototype/common/manager-bootstrap.js:233) to resolve `ready` with partial managers + errors array (optional but recommended).
- Validate across two browsers (Chromium + Safari iOS simulator) and capture a short test matrix.

1 week
- Add adjustable per-user calibration UI (knuckle span scale, palm-gating toggle, sensitivity slider) and a short onboarding with "calibrate" step.
- Add OneEuro smoothing + small predictive KF for TOI if needed; run extended capture (Explore) for edge cases.
- Integrate tipping/ads: lightweight overlay for tipping and an unobtrusive ad slot — keep telemetry to measure engagement ([`September2025/Tectangle/src/telemetry/pinchTelemetry.js:37`](September2025/Tectangle/src/telemetry/pinchTelemetry.js:37)).

INDUSTRY BEST PRACTICES (concise)
- Normalize tip distances by hand size (knuckle span) to make thresholds device- and distance-invariant.
- Use palm gating (palm normal dot camera or wrist quaternion) to avoid accidental pinches while typing/holding device.
- Use hysteresis (separate trigger/release thresholds) and require short consecutive frames (1–3) to reduce chatter.
- Smooth raw landmark positions with OneEuro (low minCutoff, small beta) to preserve responsiveness while removing jitter.
- Use a small predictive filter (light KF or linear extrapolation) to estimate Time-of-Impact by 1–2 frames to reduce perceived latency.
- Keep telemetry lightweight and non-blocking; do not let telemetry failures block event emission.
- For demo-level mapping, dispatch in-page keyboard events; for system/global mapping, use a native bridge / WebMIDI / WebSocket to an external process.
- Provide explicit UI feedback for gating state and allow quick recalibration.
- Validate across multiple browsers and front/back cameras — document failures and fallbacks.

MINIMAL ALGORITHMIC RECIPE — Palm‑gated pinch (deterministic, reproducible)

Required inputs
- landmarks[] array (MediaPipe canonical, 21 points) providing x,y,z in normalized camera coordinates.
- frame timestamp and controllerId.

Precompute
- wrist = landmarks[0]; index_mcp = landmarks[5]; pinky_mcp = landmarks[17]; thumb_tip = landmarks[4]; index_tip = landmarks[8].
- knuckleSpan = distance(index_mcp, pinky_mcp)  // scalar > 0

Palm gating test
- Compute palmNormal = normalize(cross(index_mcp - wrist, pinky_mcp - wrist)).
- Let cameraForward = [0,0,-1] in camera coordinates (adjust sign per pipeline). Compute facing = dot(palmNormal, cameraForward).
- Accept palm-facing if facing >= 0.5 (approx < 60°); else gate-out.
- Optional wrist tilt: roll = atan2(palmNormal.y, palmNormal.x) — require |roll| < 60° to avoid side-grip triggers.

Distance normalization
- tipDist = distance(thumb_tip, index_tip).
- normTip = tipDist / knuckleSpan  // normalized across hand sizes

Hysteresis thresholds (start values)
- triggerNormalized = 0.20  // pinch:down when normTip <= 0.20
- releaseNormalized = 0.35  // pinch:up when normTip >= 0.35
- minConsecutiveFrames = 1  // increase to 2 for noisier feeds

Smoothing / prediction
- Apply OneEuro to tip positions or directly to normTip.
- OneEuro start params (for ~60Hz): freq = 60, minCutoff = 1.0, beta = 0.005, dCutoff = 1.0.
- Optional KF for velocity → predict normTip 1 frame ahead. KF tune: processVar = 1e-4, measVar = 1e-2.

State machine
- state ∈ {idle, primed, triggered}
- On each frame if palm gated:
   - if normTip <= triggerNormalized then increment consecutiveBelowTrigger; if counter >= minConsecutiveFrames → emit pinch:down (attach anchor), set state=triggered, reset counter.
   - else reset consecutiveBelowTrigger.
- If state==triggered and normTip >= releaseNormalized → emit pinch:up, set state=idle.

Key synthesis rules (in‑page demo)
- On pinch:down → dispatch KeyboardEvent('keydown', { key, code, bubbles:true, cancelable:true }) to document.activeElement or to a focused target.
- On pinch:up → dispatch KeyboardEvent('keyup', same key).
- For hold semantics, keep emitting synthetic keydown only once (or use setTimeout repeating if target expects autorepeat) and cancel on pinch:up.

PRACTICAL NOTES — synthetic keyboard events & alternatives
- Browsers will not elevate synthetic in-page KeyboardEvent to OS-level system keypresses; they only affect the page and focused elements. For demos (Pinch Piano) this is sufficient.
- For system/global key injection use a native bridge (Electron/Tauri) or an external local process that accepts WebSocket or WebMIDI messages and emits OS-level input.
- WebMIDI (if available) is a reliable cross-browser path for music demos — map pinches to MIDI NoteOn/NoteOff and let existing instruments handle sound.
- WebSocket or WebRTC to a local agent is simple and works for mobile-to-desktop bridging; secure the socket and present user consent.
- Provide clear UX about permissions (camera) and a fallback "Play with demo data" mode if camera fails.

CHECKLIST — Files to fix / create and validation commands
- Fix: guard top-level await in [`September2025/Tectangle/prototype/landmark-smooth/index-src.html:224`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) (quick fix).
- Tolerant bootstrap (optional/next): change [`September2025/Tectangle/prototype/common/manager-bootstrap.js:233`](September2025/Tectangle/prototype/common/manager-bootstrap.js:233) to resolve `ready` with partial instances + errors array.
- Reuse: [`September2025/Tectangle/src/gesture/pinchBaseline.js:40`](September2025/Tectangle/src/gesture/pinchBaseline.js:40) — no algorithm rewrite required for MVP.
- Create: [`September2025/Tectangle/prototype/demo/pinch-piano-bridge.js:1`](September2025/Tectangle/prototype/demo/pinch-piano-bridge.js:1) and [`September2025/Tectangle/prototype/demo/index.html:1`](September2025/Tectangle/prototype/demo/index.html:1).
- Telemetry: ensure [`September2025/Tectangle/src/telemetry/pinchTelemetry.js:37`](September2025/Tectangle/src/telemetry/pinchTelemetry.js:37) records counts (scaffold).

Local validation commands (run from repository root `c:/Dev/Spatial Input Mobile`)
- Create a validation branch: `git checkout -b exploit/pinch-bootstrap-fix`
- Start static server (existing): `npx -y http-server ./ -p 8000 -c-1` then open:
   - `http://localhost:8000/September2025/Tectangle/prototype/landmark-raw/index.html`
   - `http://localhost:8000/September2025/Tectangle/prototype/landmark-smooth/index-src.html`
- Run smoke test against golden trace (fast): `node --test tests/smoke/pinch.baseline.smoke.test.mjs`
- (Optional) Run mocha after archive cleanup/refactor: `npx mocha` — fix CJS/ESM mix per [`September2025/Tectangle/diagnostics/triage/mocha-output.txt:2`](September2025/Tectangle/diagnostics/triage/mocha-output.txt:2)

SHOULD YOU FIX SRC OR BUILD A NEW MONOLITH?
- Recommendation: Fix SRC (Exploit) first. Pros: minimal changes, reuses deterministic tests/golden trace and existing [`September2025/Tectangle/src/gesture/pinchBaseline.js:40`](September2025/Tectangle/src/gesture/pinchBaseline.js:40), fastest path to an MVP demo and telemetry for monetization. Cons: existing bootstrap fragility may hide further legacy issues and will require a small cleanup pass ([`September2025/Tectangle/prototype/common/manager-bootstrap.js:233`](September2025/Tectangle/prototype/common/manager-bootstrap.js:233)). Confidence: 0.85.
- If bootstrap proves brittle or consumed time > 1–2 days, pivot to a small monolithic demo (Pivot) using [`September2025/Tectangle/prototype/landmark-raw/index.html:1`](September2025/Tectangle/prototype/landmark-raw/index.html:1) copy to iterate fast and avoid cross-repo fragility.

FINAL NOTES
- For immediate shipping, implement the guarded bootstrap, add the demo bridge, and ship Pinch Piano with an in‑page tipping CTA; gather usage telemetry and iterate thresholds/calibration in the first week.
- All referenced artifacts used for this decision are here: triage report and logs, prototypes, managers, baseline detector, telemetry, and smoke/golden test — see links above.

End of decision document.