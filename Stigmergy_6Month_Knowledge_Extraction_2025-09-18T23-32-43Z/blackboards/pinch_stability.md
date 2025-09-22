<!--
STIGMERGY REVIEW HEADER
Status: Draft
Review started: 2025-09-17T08-41-03Z
Expires: 2025-09-24T08-41-03Z (auto-expire after 7 days)

Checklist:
- [ ] Link to relevant manifest rows
- [ ] Capture new findings after each session
- [ ] Promote resolved items to TODO_today summary
-->

# Pinch Stability - Blackboard

## Focus
Pinch FSM, quantization, TOI, controller hygiene.

## Sources to Ingest
- [ ] (manifest) ../import_manifest.md
- [ ] metrics/doc_inventory_summary.md (filter pinch-related entries)

## Active Findings
- `Knowledge backup 20250417/MDP_AI_CODING_GUIDE.md` documents deterministic pinch heuristics; use as guardrails when formalizing Hex pinch states.
- `handsfree/handsfree/gesture-instrument/index.html` captures production-ready mobile pinch detection (per finger note mapping, instrument switching). Extract state thresholds + UX sequencing before refactor into Hex pinch core.
- `archive-august-3-2025-physics-cleanup/hand-track-3d-pinch-keyboard/` documents pinch-to-keyboard mapping with hysteresis hooks plus Oimo physics integration; mirror event names/thresholds in Hex pinch regression tests.
- August Tectangle Sprint/integration-spec.md defines pinch event contract (start/end/hold), normalized distance calc, and One-Euro + SLERP smoothing defaults; adopt these parameters in Hex pinch tests and ADR-2025-08-AugustSprintRoadmap.


## Open Questions
- _None yet_

## Next Extraction Targets
- Derive pinch state machine + quantization config from `gesture-instrument` implementation for Hex module tests.







