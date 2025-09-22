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

# Tectangle Hexagonal � Reality Check

## Observed Mismatches
- **Frame-rate�dependent tracker inertia** � `createHandTrackerT1` stores velocity as raw frame deltas without dividing by elapsed time, so behavior shifts with FPS (September2025/TectangleHexagonal/src/ports/handTrackerT1.js:106). When recordings run at 30?fps vs 60?fps the `maxJump`/`teleport` heuristics move, eroding the �stable IDs� promise. Documented claims about wrist inertia only hold if we normalise by `dt`.
- **Hand-ID lab wired to the wrong global** � the lab page reads `window.__lastHands` (September2025/TectangleHexagonal/dev/hand_id_lab.html:109) but the MediaPipe port publishes `window.__hexLastHands` (September2025/TectangleHexagonal/src/ports/mediapipe.js:29). Because of that mismatch the lab silently falls back to per-frame landmarks, hiding tracker glitches the HUD was meant to surface.
- **Controller router ignores tracker IDs** � pinch events dispatched from `main.js` never include `handId`, so the router keys seats off the string `'Left'/'Right'` (September2025/TectangleHexagonal/src/app/main.js:31, September2025/TectangleHexagonal/src/ports/mediapipe.js:48). Any temporary handedness flip from MediaPipe can rebind P1/P2 despite the Tier-1 tracker computing stable IDs.
- **Lock-in smoke test can false-fail** � `p1p2_lockin_run.cjs` assumes the first two `pinch-key` downs belong to different hands (scripts/p1p2_lockin_run.cjs:108). A single hand emitting two downs (debounce hiccup) causes the script to flag controller assignment even if the second hand later claims P2. The doc promises �1/1 per hand,� but the harness doesn�t reflect that tolerance.

## Recommendations
- **Normalise tracker velocity** � carry the previous timestamp per track and compute velocity as ?pos/?t. Proven pattern: light constant-velocity Kalman or even the SORT-style predictor keeps inertia consistent regardless of frame pacing.
- **Share one debugging seam** � expose the same `window.__hexLastHands` (or align the name) in every lab so prototype HUDs read identical tracker output. This keeps detections, goldens, and docs in sync.
- **Propagate `handId` through the event bus** � attach the tracker�s `handId` to `core.update` frames and emit it in pinch events (or route through `hand_event_router.mjs`). Then lock P1/P2 off IDs, not transient labels; this mirrors long-running precedents in controller or VR hand tracking.
- **Harden the lock-in harness** � when checking P1/P2, require distinct controller IDs anywhere in the session, not only the first two downs. This matches how other approval tests tolerate retries while still flagging regressions.

## Suggested Next Steps
1. Patch the tracker to use elapsed milliseconds, rerun the two-handed goldens, and record the new teleport/reassign counts.
2. Align the lab globals so HUD experiments report tracker mismatches as-designed.
3. Extend pinch events with `handId` and update controller routing + goldens before trusting the Tier-1 ID story in docs.
4. Relax the smoke test to look for distinct controllers over the full trace; then we can add a second assertion on per-hand down/up counts.
