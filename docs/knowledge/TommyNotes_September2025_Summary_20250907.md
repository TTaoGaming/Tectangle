# TommyNotes — September 2025 Summary
TL;DR: Define and execute phase-zero single-pinch orientation-gated triggers, shift to manager-based architecture, remove smoothing-induced latency, and prototype touchscreen/multi-input emulator and predictive lookahead for musical feel.

Executive summary:
September refines the product roadmap into explicit time horizons and phases and doubles down on deterministic pinch detection and predictive latency. Notes codify "phase zero" single-pinch orientation gating and then scale to 4-pinches and wrist quaternion mapping; they also restate the manager architecture, the need to remove excessive EMA smoothing that's causing multi-second pinch lag, and the business vision (free/time-gated features, long-term educational/medical goals). ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:1))

Key ideas & distilled insights:
- Phase-based roadmap for incremental risk reduction: phase zero = single pinch + orientation-gated time-to-impact prediction; phase one = deterministic multi-pinches + wrist mapping; later phases = games, 100+ MPE instrument, medical/tool virtualization. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:1))
- Orientation gating: require palm-facing-camera and simple constraints early to reduce flicker and mis-tracking; a reliable start gate greatly reduces downstream filtering complexity. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:108))
- Triple-check pinch model: knuckle-span absolute ruler (distance + normalization), fingertip velocity toward each other (accel/velocity gating), and joint-angle change as tertiary check; combine via confidence consensus. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:50))
- Predictive time-to-contact: use short lookahead windows (velocity-based time-to-contact) plus quantization for musical inputs to achieve perceived negative latency. Make lookahead user-adjustable. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:1))
- Manager-first architecture: split pipeline into camera / landmark / physics / anatomy / mapping managers with a standard header/API to enable automated smoke harness testing and AI-agent onboarding. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:153))
- Product primitives: touchscreen/mouse/multitouch/VR-hand emulation as high-priority product hooks — these map the gesture layer into existing software affordances and expand use-cases quickly. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:243))
- Reuse infra where possible: prefer existing pose libraries (e.g., "human" by Vlad) for robust detection so the team can focus on logic and output rather than reinventing pose infra. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:307))

Actionable next steps (prioritized):
1. Implement phase-zero single-pinch orientation-gated trigger — owner: engineer — effort: 1–2 days. Add palm-facing gating, velocity time-to-contact prediction, and deterministic single-pinching telemetry. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:1))
2. Remove / retune the 3-buffer EMA smoothing that causes seconds-long lag — owner: engineer — effort: 3–8 hours. Replace with lighter One‑Euro or tunable EMA mapped to a slider; log before/after registration latency. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:145))
3. Create Manager API template + file header standard — owner: you — effort: 2–4 hours. Define TL;DR, inputs/outputs, expected events, and a smoke-test for each manager. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:135))
4. Telemetry & UI cleanup — owner: engineer — effort: 1 day. Move telemetry start/stop/export into sidepanel, remove floating HUD, and surface per-check confidence meters. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:45))
5. Prototype touchscreen/mouse emulator and 4‑pinch wrist-quaternion mapping for keyboard events — owner: engineer/agent — effort: 3–5 days. Build 16-key prototype (expand to 88+ later) to validate mapping and feel. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:243))

Quick technical notes (prototypes & parameters):
- One‑Euro filter as a user‑facing slider mapped to deterministic cutoff values for reproducible smoothing levels. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:66))
- Knuckle‑span normalization: measure a baseline span per-device and normalize z-depth using palm-facing constraint; treat measuredSpan as calibration anchor. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:93))
- Velocity/acceleration gating: compute fingertip velocity vectors; require inward velocity magnitude > threshold for trigger and outward for release; add outlier gating. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:124))
- Use lookahead window (time‑to‑contact) + quantization (BPM, strength, swing, humanize) for musical events; expose lookahead as user parameter. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:88))

Triage (keep / archive / investigate):
- Keep: Phase definitions and timeline (phase zero → quarter → year). ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:1))
- Keep: Manager-API / DeepDiveManager documents. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:135))
- Investigate: EMA 3-buffer lag (root cause and tunings). ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:145))
- Keep: Touchscreen / mouse / VR-hand emulator idea (high reuse value). ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:243))
- Archive: Node smoke tests — migrate to Mocha as suggested. ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:304))
- Investigate: hand duplication logic (two hands occupying same 3D space). ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:133))

Curated quotes (verbatim with locations):
1. "Important phases phase zero single pinch orientation gated time to impact prediction single pinch phase .54 pinches on one hand Phase one is for deterministic pinches with wrist key mapping" ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:1))
2. "I changed the camera input to be my camera manager, can you first make sure it console logs on start up with settings and values." ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:143))
3. "the idea is to fuzzy match noisy landmark inputs to a physical hand in 3D space" ([`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:155))

Appendix:
Original source: [`TommyNotesSeptember2025.txt`](TommyNotesSeptember2025.txt:1)