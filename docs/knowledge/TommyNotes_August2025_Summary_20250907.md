# TommyNotes — August 2025 Summary
TL;DR: Focused on making pinch detection robust and low-latency by 1) formalizing a 3-check consensus model (knuckle-span, velocity, joint-angle), 2) moving to a manager-based pipeline, and 3) cleaning UI/telemetry so testing and tuning are tractable. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:13))

Executive summary:
August's notes center on turning noisy prototype behavior into deterministic, testable components. The primary engineering work is to harden pinch detection (three independent checks and a confidence consensus), eliminate smoothing-induced lag, and reorganize the codebase into single-responsibility "managers" (camera, landmarks, anatomy, mapping) with a consistent header/API for easier AI-agent and human onboarding. UX priorities are to declutter the HUD, consolidate telemetry into a single side-panel control, and expose a small set of deterministic, user-facing tuning controls (smoothing, lookahead, quantization). These changes are explicitly intended to enable high-confidence real-time musical interactions (low perceived latency) and scale toward multi‑pinch and wrist-quaternion key mapping. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:125))

Key ideas & distilled insights (6–10 short bullets):
- Three independent checks (knuckle-span absolute ruler, fingertip velocity/acceleration, and joint-angle/bend) drastically reduce false positives when combined via confidence scoring. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:32))
- Use a confidence-consensus (e.g., require 2-of-3 high-confidence checks) to make triggers deterministic and auditable. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:79))
- Predictive time-to-contact (short velocity lookahead) can create perceived negative latency for musical triggers if tunable per-user. Expose lookahead as a user control. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:107))
- Manager-based architecture: convert subsystems into black-box managers with standard AI headers (TL;DR, inputs, outputs, events) to simplify code audits and automated smoke tests. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:135))
- Minimal, deterministic UI: one telemetry start/stop/export button in sidepanel, no floating HUD, and a single smoothing slider mapped to deterministic filter parameters (e.g., One‑Euro presets). ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:28))
- Palm/orientation gating reduces noise for pinch mode and simplifies downstream validation — require palm-facing-camera on start. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:90))

Actionable next steps (5 prioritized; each with owner and effort):
1. Implement consensus trigger + per-check telemetry — owner: engineer — effort: 4–8 hours.
   - Compute per-check confidences, require configurable N-of-M agreement (default 2-of-3), and record metrics for false positives/negatives. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:79))

2. Camera-manager smoke test & alignment logging — owner: you — effort: 30–90 minutes.
   - Add console output of camera settings, resolution, coordinate frame and initial calibration on startup so alignment problems can be reproduced and reported. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:125))

3. Remove/retune smoothing buffer causing lag — owner: engineer — effort: 4–12 hours.
   - Replace heavy EMA stacks with One‑Euro presets and expose slider mapped to deterministic cutoff values; measure registration latency before/after. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:127))

4. UI/telemetry cleanup & sidepanel migration — owner: engineer — effort: 1–2 days.
   - Remove floating HUD, move telemetry to sidepanel (single start/stop/export), and add visual confidence meters per pinch-check. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:27))

5. Prototype predictive lookahead for musical input — owner: engineer/agent — effort: 2–4 days.
   - Implement velocity-based time-to-contact prediction, quantization (BPM, strength, grid/snap, humanize), and a 16-key piano demo to validate feel. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:70))

Quick technical notes (3–6 bullets):
- Smoothing: user-exposed One‑Euro filter slider with deterministic mapping (e.g., index 0..10 maps to cutoff frequency table) to let experiments be reproducible. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:48))
- Knuckle-span normalization: measure a baseline measuredSpan with palm-facing calibration; use normalized span + z-depth invariance checks for absolute distance triggers. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:73))
- Velocity/acceleration gating + joint-angle delta: require inward fingertip velocity above threshold for trigger, outward velocity for release, and minimum joint-angle change for a tertiary verification. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:34)) 
- Confidence model + lookahead: compute per-frame confidences, perform short lookahead time-to-contact and vote across checks before emitting events. Expose "lookahead window" and "consensus threshold" as tuning knobs. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:81))

Triage list (what to keep / archive / investigate — up to 6 items):
- Keep: Manager-interface plan and DeepDive manager documents — high priority for maintainability. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:135))
- Keep: 3-check pinch model (knuckle-span, velocity, joint-angle) as core detection strategy. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:32))
- Investigate: EMA triple-buffer causing seconds‑long registration lag (root cause & replace/retune). ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:127))
- Investigate: hand duplication (left/right overlaying same real hand) — implement spatial plausibility and head/wrist zones. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:115))
- Archive: legacy 3DPlayground UI elements not used by Tectangle — remove from active UI. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:30))
- Keep (backlog): Quantization/MPE module (BPM, swing, humanize) as next-layer musical feature. ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:70))

Short curated quotes (3) — preserved verbatim:
1. "the idea is 3 pinch redundancy systems" ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:32))  
2. "I think the math should be very simple so we shouldn't be having a lot of performance issues" ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:13))  
3. "I changed the camera input to be my camera manager, can you first make sure it console logs on start up with settings and values." ([`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:125))

Appendix:
Original source (raw notes): [`TommyNotesAugust2025.txt`](TommyNotesAugust2025.txt:1)