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

# Pro Gesture + Audio Roadmap (2025-09-13)

Scope (Hexagonal, append-only)

- Quantization: grid/strength/swing/humanize; render quant marker; expose via port.
- Looper: record/overdub/playback gesture events; JSON export/import; deterministic.
- A/V Output: MediaRecorder harness for canvas + audio; sharable webm.
- Plausibility: distance hysteresis × velocity/accel × joint-angle gate.
- Lookahead: 1D Kalman “ghost” dot; user knob (ms).

Ports/Adapters (DOM/IO)

- ports/mediapipe: landmarks source (VIDEO/IMAGE), emits full hand.
- ports/latencyPort: lag + user offset; add quant param pass-through.
- ports/looper: gesture loop as JSONL; post-editable.
- ports/avRecorder: record canvas+audio.

Core (pure)

- core/plausibility: add angle gating + params.
- core/handGeometry: joint angles/palm/straightness, bone ratio ID.
- core/kalman1d: x,v + lookahead(ms).
- core/quantize: time quantize with swing/humanize.

CI slices

- Deterministic MP4s: confirm 1/0; plausibility true/false as expected.
- Unit: geometry angles and IDs; kalman prediction; quantize invariants.

Notes

- Facade stays simple; expert knobs behind advanced panel; config export.
