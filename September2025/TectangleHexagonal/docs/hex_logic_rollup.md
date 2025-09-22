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

# TectangleHexagonal — Logic Rollup (Reuse‑only)

Map in one line

- Domain = pinch FSM + filters + palm gate. Ports = `FrameSource`, `EventSink`, `Telemetry`, `Config`, `Clock`, `Storage`. Adapters plug without leaking infra.

Domain core (pure, keep)

- Per-frame input: `{ t, hand, wrist, indexMCP, pinkyMCP, indexTip, thumbTip }` (`x`,`y`∈[0..1], `z` relative).
- Normalize by knuckle span; OneEuro smoothing; palm cone gate; enter/exit hysteresis; optional speculative down.
- Emits: `pinch:down`/`hold`/`up`/`cancel`. Telemetry: `downs`/`ups`, `specCancelRate`, `meanDownLatency`, `frames`.

Ports (contracts)

- FrameSource: `start(onFrame)`, `stop()`; `onFrame(f)` as above.
- EventSink: `onPinch(evt)` or `dispatch(evt)` to UI/Bus.
- TelemetrySink: `start(meta)`, `frame(obj)`, `stop()` → goldens/landmarks.
- Config: `get/set/subscribe` (enter/exit, cone, OneEuro params, palmGate).
- Clock: `now()`, `schedule()`. Storage: `load/save` (prefs, calibration).

Current adapters

- MediaPipe VIDEO (live/MP4, CDN). MediaPipe IMAGE (frame folders, CI-safe).
- Recorders: Golden (`t,norm,state,gate,+events`), Landmarks (5 keypoints).
- Dev hooks: `window.__hex.{processFrameUrls, startVideoUrl, replayLandmarks}` + `window.__getGolden`/`window.__getLandmarks`.

Reuse‑only consolidation

- Reimplement here as utils/ports: `debounce(ms)`, tiny `EventBus` (pub/sub), Config store (defaults + URL/env), retry/backoff for CDN.
- Keep all infra under `src/ports` | `src/utils`; domain stays DOM-free.

Migration pattern (proven)

- Define ports → write thin adapters → backend toggle in composition root.
- Contract test: same downs/ups and golden envelopes across backends (`pinch.jsonl`, `gated.jsonl`).
- Strangle old paths by replaying landmarks first; add real sources incrementally.

CI path

- Frames → JSONL via `tests/smoke/run_video_collect_golden.js`.
- Artifacts: `September2025/TectangleHexagonal/out` (pinch/gated).

PWA later

- Add manifest + SW; cache WASM/models; serve COOP/COEP if self-hosting models.
