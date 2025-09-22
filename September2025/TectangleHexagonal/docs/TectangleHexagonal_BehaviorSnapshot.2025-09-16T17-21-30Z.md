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

# Tectangle Hexagonal Behavior Snapshot - One-Pager
Generated: 2025-09-16T17-21-30Z

Headlines
- App boots through `src/app/main.js`, wiring MediaPipe (or deterministic replay) into two `createPinchCore` instances and a controller router, then fans events out to HUD overlays, audio, MIDI, telemetry, and golden recorders.
- The domain core still honors the hexagonal boundaries: `src/core/pinchCore.js` stays pure math/filters, `src/ports/*` wrap hardware/IO, and `src/app/controllerRouterCore.js` remains DOM-free, but the glue in `main.js` concentrates a lot of orchestration logic.
- Deterministic tooling exists (JSONL goldens, replay scripts) and fresh tests target controller routing and pinch speculation, yet CI/Husky do not currently enforce those runs.

Pinch detection path
- Each hand gets its own `createPinchCore` with OneEuro smoothing, palm cone gating, hysteresis thresholds, and speculative downs that confirm or cancel depending on follow-up frames (`pinch:down`, `pinch:confirm`, `pinch:cancel`, `pinch:up`, `pinch:toiActualStop`).
- Query flags such as `?mock=1`, `?process=frame&stepMs=60`, `?enter=0.5&exit=0.8` steer the core without touching code, keeping deterministic runs accessible during replay sessions.
- Golden/landmark recorders capture every frame and event; `analysis.event(...)` writes timing metadata that the replay validators read (`tests/replay/*.mjs`).

Seat routing & multiplayer
- `createControllerRouter` assigns seats on the first pinch per hand, respects pairing order (default P1 then P2), and limits seats by the max concurrent hands observed within a short window.
- When a hand disappears past `lostAfterMs`, the router keeps a seat reservation tied to the last wrist position; a new hand entering that space within `snapDist` reclaims the seat without a pinch (proximity reacquire).
- Preferred controllers arriving from events (e.g., replays or external routing) are honored when available, and hand labels can bias toward specific seats when `preferByHandLabel` is enabled.

UI & instrumentation
- The DOM layer highlights piano keys, dispatches browser events (`hex-pinch`), plays beeps/MIDI notes, mirrors controller IDs into overlay badges, and posts messages to parent frames for iframe demos.
- `RunState` flags (`mediaReady`, `mpStarted`, `playing`) and `window.__hex` hooks expose harness-friendly status so smoke tests can wait for readiness.
- Telemetry hooks (`Telemetry.noteDown/Up`, `Telemetry.noteSpecCancel`) and analysis recorder keep measurement data aligned with golden outputs for later validation.

Automation & coverage today
- Unit tests in `tests/unit/pinchCore.test.mjs` cover hysteresis, palm gating, speculative confirm/cancel, and TOI stop emission; controller routing has dedicated suites for pairing, concurrency, reservation, and re-entry.
- E2E suites (`tests/e2e/p1p2_lockin.test.cjs`, `hand_id_lab.test.js`, `controller_router_lockin.test.js`) launch the dev pages with recorded videos to assert seat assignment and ID stability.
- Smoke runners (`tests/smoke/run_video_check_seats.mjs`, `run_video_vendor_bridge.js`) process clips through the browser and inspect emitted metadata, but they run manually unless someone triggers the scripts.

Drift signals
- `src/app/main.js` has become a catch-all for DOM wiring, recorder configuration, and controller routing; without a bootstrap seam it is easy for adapters to leak domain state or vice versa.
- `faultline/map.json` is still empty, so intentional boundary exceptions are not tracked; AI-assisted edits can cross layers without a paper trail.
- Replay/golden validation scripts exist yet are not bound to Husky or CI, leaving room for silent regressions in speculative timing or telemetry schemas.
- Dependency discipline relies on developer habits; there is no graph lint to stop a `port` importing from `ui` or other forbidden arrows.
