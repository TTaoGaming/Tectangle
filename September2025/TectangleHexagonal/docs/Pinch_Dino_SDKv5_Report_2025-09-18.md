<!--
STIGMERGY REPORT HEADER
Id: SDKV5_DINO_REPORT
Status: Draft
Generated: 2025-09-18T00:00Z
Tags: pinch,dino,handedness,telemetry
-->

# SDK v5 Pinch -> Dino Diagnostic Report (2025-09-18)

## Summary
- SDK consumers never receive typed pinch events because `HexInput.create().on()` ignores the `type` argument; Dino sidecar subscriptions silently no-op (`September2025/TectangleHexagonal/src/sdk/hexInputFacade.js:46`).
- Existing smoke/e2e tests register the same broken listener shape, so the regression is invisible; manual smoke runner shows zero downs.
- Mediapipe handedness is still the primary seat selector across the stack. When the Tier-1 tracker fails to stabilise IDs, left/right labels leak through into routing and telemetry.
- Rich telemetry plumbing is loaded but dormant (`pinchTelem`, `FEATURE_SEAT_TELEM_V1`); no automated guard checks for missing samples.

## Key Defects Blocking Dino Sidecar
1. **Facade Event API mismatch**  
   - `sdk.on('pinch:down', handler)` only stores the function (`handlers.add(handler)`) and never associates the event name; AppShell emits enriched objects, but listeners expecting typed filtering never fire (`September2025/TectangleHexagonal/src/sdk/hexInputFacade.js:46-55`).  
   - `createDinoSidecar` subscribes using the two-argument shape, so downs/ups counters stay at zero and no keyboard events are injected (`September2025/TectangleHexagonal/dev/sidecars/dino_sidecar.mjs:117-119`).
2. **Tests masking the failure**  
   - `v5_dino_sidecar_smoke` registers the same broken listener and only asserts probe counts when the summary already shows downs, so the test passes with zero engagement (`September2025/TectangleHexagonal/tests/e2e/v5_dino_sidecar_smoke.test.js:34-53`).  
   - `run_v5_dino_p1_only.js` exits with "No P1 downs detected" because the sidecar summary remains empty (`September2025/TectangleHexagonal/tests/smoke/run_v5_dino_p1_only.js:30-38`).

## Recommended Test Additions (no code touched yet)
- **Facade unit coverage**: Extend `sdk_facade.contract.test.mjs` to assert that `api.on('pinch:down', fn)` is invoked; currently it only checks the single-argument form (`September2025/TectangleHexagonal/tests/unit/sdk/sdk_facade.contract.test.mjs:18-33`).
- **Sidecar e2e assertion**: In `v5_dino_sidecar_smoke`, fail fast when `window.__dino.getSummary().downs` stays at 0 after the clip finishes (ready sentinel already scaffolded via `FEATURE_V5_READY_SENTINEL`).
- **Smoke CLI gate**: Have `run_v5_dino_p1_only.js` exit non-zero when probe counters stay 0 so the failure propagates to CI.

## Handedness vs HandId Audit
| Path | Usage | Risk |
| --- | --- | --- |
| `src/ports/mediapipe.js:46-68` | Derives `handTag` from MediaPipe handedness each frame; `handId` only present if `handTrackerT1.assign` succeeds. | Any instability in handedness leads to seat flapping; without tracker, every frame reverts to `Left/Right` guess. |
| `src/ports/handTrackerT1.js:60-109` | Allocates seats using label-driven preferences (`Left -> seats[1]`, else seats[0]); bones hashed from 2D wrist space. | Tracker itself biases towards handedness; if the label flips, seat assignment can oscillate. |
| `src/app/controllerRouterCore.js:65-110` | `keyFor(event)` prefers `handId`, else falls back to `hand` label; pairing and seat reservations store `hand:${label}` keys. | With two hands emitting the same label, the router merges them, breaking seat lock-in. |
| `dev/sidecars/dino_sidecar.mjs:12-175` | Seat filter defaults to `P1`; fallback `seatFromHand()` re-derives seat from hand label (`Left -> P1`, `Right -> P2`). | When seat is missing and label noisy, Space key can route to the wrong player; fallbacks should rely on `seat`/`handId`. |
| `src/app/appShell.js:107-141` | `router.onPinchEvent({ hand, handId })` drives seat mapping; telemetry buckets keyed by `enriched.seat`. | No guard rails when both values are null; seat assignment depends entirely on upstream claims. |
| `src/adapters/hand_event_router.mjs:54-110` | Maintains `handId -> seat`; on fallback, still biases using `e.hand`. | Downstream consumers may assume `handId` is stable even when it is unavailable. |

## HandId Reality Check
- `handId` is only populated when `handTrackerT1.assign()` runs (the tracker import can fail silently). When absent, events degrade to the `Left/Right` label from MediaPipe.
- The tracker uses wrist 2D positions and velocity to maintain continuity (`September2025/TectangleHexagonal/src/ports/handTrackerT1.js:127-159`); no 3D bones are required, so enabling it consistently would provide the 2D stability you want.
- Add a telemetry counter or log when `ann?.handId` is null so tracker dropout is observable.

## Suggested Next Steps
1. Patch `HexInput.create().on()` to support `(type, handler)` while keeping the `(handler)` overload; add unit coverage for both shapes.
2. Tighten e2e and smoke assertions so Dino builds fail when no downs are produced.
3. Force-enable the Tier-1 tracker (or fail loud when it is missing) and pipe the resulting `handId` through to seat assignment and telemetry.
4. Replace `seatFromHand()` fallbacks with explicit `seat`/`handId` checks to avoid reintroducing handedness bias.
5. Once telemetry is wired, add a CI probe that ensures `pinchTelem.snapshot()` and `tti.getSamples()` return non-empty arrays during golden clip playback.

Stay disciplined - plan the slice, add the guard test, log the telemetry, reflect, repeat.
