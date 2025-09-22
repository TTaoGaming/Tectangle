---
id: ww-2025-096
owner: @TTaoGaming
status: active
expires_on: 2025-10-04
guard: ci:state-merge-sanity (all streams present; event order monotonic; 0 drops in 5s)
flag: FEATURE_STATE_MERGE_CANON
revert: remove adapter + flag
---
# Webway: State Merge Canon for gestures + prediction + rhythm

## Goal
Define a small, durable merge layer that turns raw landmarks, gesture labels, predicted onsets, and optional musical quantization into one coherent event stream per seat. Make it iframe-friendly and testable.

## Constraints
- No new heavy deps; reuse in-repo ports and native Web APIs (source: defaults)
- Must preserve ordering and include timestamps and provenance (source: defaults)
- Keep payloads small and serializable for postMessage/BroadcastChannel (source: defaults)

## Current Map
- Sources available: landmarks (HandLandmarker), labels (GestureRecognizer), Kalman TOI/lead_ms, seat adapters (source: repo)
- Event conventions: selectstart/selectend; rich telemetry JSONL exists (source: tests)

## Timebox
20 minutes to ship a thin adapter and a smoke.

## Research Notes
- Merge patterns: fan-in queue with lamport-like clock and ts normalization to performance.now() (source: standards)
- Provenance helps debugging flakiness across filters/prediction (source: experience)

## Tool Inventory
- Adapter: `src/adapters/stateMergeCanon.mjs` exporting unifyStreams({seat, sources}) → AsyncGenerator of `{type, phase, ts, lead_ms?, score?, src}` (source: file plan)
- Clock: performance.now(); AudioContext.currentTime if quantizer on (source: standards)
- Tests: puppeteer smoke runs parent page and asserts ordering and presence (source: tasks)

## Options (Adopt-first)
1. Baseline — Merge labels + landmarks → selectstart/selectend with hysteresis only.
   - Trade-offs: Lowest complexity; no prediction or rhythm.
2. Guarded extension — Add predicted onsets (SelectPred) with lead_ms and reconcile when actual arrives; include src fields.
   - Trade-offs: Slightly more complex; better feel.
3. Minimal adapter — Add optional tempo quantizer that wraps the merged stream, snapping non-critical phases to musical grid.
   - Trade-offs: Intentional small delay; feature-flagged.

## Recommendation
Option 2 first. Keep Option 3 off by default and only for rhythm mini games.

## First Slice
- Implement `stateMergeCanon.mjs` with simple fan-in queues per seat; normalize ts; include src tags. // WEBWAY:ww-2025-096
- Parent demo prints merged events; bus forwards to iframes. // WEBWAY:ww-2025-096

## Guard & Flag
- Guard: ci:state-merge-sanity ensures events are monotonic and include required fields over 5s synthetic feed.
- Flag: FEATURE_STATE_MERGE_CANON controls adapter usage.

## Industry Alignment
- State machines/streams as merging layers; WebXR-style select; BroadcastChannel/postMessage friendliness (source: standards)

## Revert
Delete adapter and remove flag; upstream sources unchanged.

## Follow-up
- TTL: evaluate reconciliation metrics after 7 days; record drift and adjust filters.
- Consider pluggable back-pressure or batching for low-end devices.
