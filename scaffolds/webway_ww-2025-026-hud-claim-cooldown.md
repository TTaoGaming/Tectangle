---
id: ww-2025-026
owner: @team
status: active
expires_on: 2025-10-05
guard: ci: hex:verify:fast; optional: hex:smoke:camera:seats:v2
flag: FEATURE_HUD_ALIGNED_LABEL, FEATURE_SEAT_CLAIM_COOLDOWN
revert: remove flags or revert v2 demo file change
---
# Webway: HUD alignment + seat claim cooldown

## Goal

Fix wrist HUD cross-contamination by using per-hand aligned labels; reduce transient P3/P4 spikes by adding a short seat-claim cooldown. Keep the change reversible and guarded.

## Constraints

- License: MIT (source: package.json)
- Deps: no new runtime deps; feature-flagged (source: defaults)
- Perf: HUD draw path unchanged; O(Hands^2) small alignment compute (source: message)
- Privacy/Security: no telemetry added (source: defaults)
- CI: must pass unit + overlay smoke (source: defaults)

## Current Map

v2 demo uses HandLandmarker + GestureRecognizer; IDs via HandTrackerT1; One Euro smoothing; seats P1–P4 with anchors/ghosts/gating. HUD sometimes shows the wrong label; fast motion can spike to P3/P4 claims (source: message).

## Timebox

20 minutes (source: defaults)

## Research Notes

- Align gestures to detections by nearest wrist to avoid cross-hand bleed (source: code)
- Add claimCooldownMs and labelScoreMin to smooth transient jumps (source: code)
- Flags allow A/B: FEATURE_HUD_ALIGNED_LABEL, FEATURE_SEAT_CLAIM_COOLDOWN (source: code)
- Unit + overlay smokes remain green after patch (source: run logs)

## Tool Inventory

- npm scripts: hex:verify:fast, hex:overlay:verify, hex:test:unit, hex:smoke:camera:seats:v2, hex:e2e:v2:idle:jsonl, hex:e2e:v2:pinch:jsonl (source: package.json)
- WinBox seats window for live seat view (source: code)
- JSONL exporters for headful audit (source: tests)

## Options (Adopt-first)

1. Baseline — Only fix HUD by aligned labels
   - Trade-offs: HUD stable; seat spikes remain possible under churn.
2. Guarded extension — HUD fix + claim cooldown (current)
   - Trade-offs: Slight latency before new seats claim; reduces false P3/P4.
3. Minimal adapter — Move claim buffer into ControllerRouter with sustain window
   - Trade-offs: Larger refactor; stronger guarantees; more coupling.

## Recommendation

Option 2: Fix HUD and add a small cooldown behind flags. Fast, reversible, measurable.

## First Slice

- Implement aligned per-hand HUD label selection.
- Introduce seatCfg.claimCooldownMs and seatCfg.labelScoreMin.
- Gate with FEATURE_HUD_ALIGNED_LABEL and FEATURE_SEAT_CLAIM_COOLDOWN.
- Validate unit + overlay smoke; optionally run headful JSONL exporters.

## Guard & Flag

- Guard: npm run -s hex:verify:fast; optional: npm run -s hex:smoke:camera:seats:v2 (no burst >1 claim within 600ms)
- Flag: FEATURE_HUD_ALIGNED_LABEL=1 (default), FEATURE_SEAT_CLAIM_COOLDOWN=1 (default)

## Industry Alignment

- MediaPipe Tasks Vision hand/gesture pairing; wrist-proximity alignment is a common reconciliation tactic (source: docs)
- Seat claim cool-down mirrors debouncing in HCI for stability (source: defaults)

## Revert

- Disable flags via URL: ?FEATURE_HUD_ALIGNED_LABEL=0&FEATURE_SEAT_CLAIM_COOLDOWN=0
- Or remove the patch from v2 HTML.

## Follow-up

- TTL check: if JSONL shows reduced spikes over 1 week, make cooldown permanent.
- Additional notes: consider moving sustain window to seatConcurrencyCore.
