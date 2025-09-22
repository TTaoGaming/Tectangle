<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Log decisions in TODO_2025-09-16.md
-->

# Scribe Note — Hand Tracker T1 Sidecar Lab (2025-09-15)

Status: Working (manual validation)  
Webway: ww-2025-001  
Lab: `dev/canned_hand_id_test_prototype.html` (iframe sidecar embedding `index.html`)  

Summary

- Sidecar iframe pattern successfully stabilizes IDs without touching core pinch code (focus: persistent H1/H2 across occlusion + leave/return).
- Tracker stats (frames, teleports, reassigns, alive) increment as expected during occlusion/crossing tests.
- Reassign/teleport counts remain low on normal movement; teleport spikes only on deliberate big jumps.
- Easy revert: delete lab page + remove global `__hexLastHands` exposure and WEBWAY markers.

Observations

- Polling overhead negligible (RAF-based). No visible frame stutter at 30–60fps.
- Landmark seam (`__hexLastHands`) is now an implicit port; formalizing it would simplify future A/B comparators.
- Feature flag not yet driving iframe (tracker runs locally); acceptable for prototype phase.

Next Recommendations

1. Add param controls (maxJump, teleport, memoryMs) to lab panel.
2. Dual-run comparator vs legacy `hand_id_lab` to surface divergence events.
3. Emit JSONL telemetry snapshot (every N frames) for future golden-based CI guard.
4. Formalize seam accessor: `window.__hex.getLandmarksFrame()` with version + timestamp.

Guard Targets (manual)  

- teleports < 6 (no-pinch occlusion clip)  
- reassigns < 4  
- alive <= 2 always  

Authored: automated scribe (soap) on 2025-09-15.
