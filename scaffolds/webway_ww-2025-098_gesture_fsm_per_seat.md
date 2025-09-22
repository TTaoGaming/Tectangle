---
id: ww-2025-098
owner: @spatial-input-team
status: active
expires_on: 2025-10-05
guard: hex:e2e:v2:idle:jsonl
flag: FEATURE_SEAT_FSM_PER_TRACK
revert: remove folder/flag
---
# Webway: Per-seat gesture FSM (xstate) with telemetry hooks

## Goal
Ensure per-track isolation so P1 HUD never shows P2 gestures; gate gestures through a per-seat XState FSM and emit rich, per-seat telemetry.

## Constraints

- License: OSS only; keep MediaPipe Tasks and xstate (source: files)
- Dependencies: 1 small lib max (xstate already present) (source: files)
- Perf: ≤ 200ms UI budget; no extra work unless flag enabled (source: defaults)
- Privacy/Security: no network telemetry; JSONL export only on explicit action (source: files)
- CI: existing smokes must pass; new flag must default OFF (source: files)

## Current Map

- v2 page aligns recognizer → detector by nearest wrist and caches per stable key (source: dev/camera_landmarks_wrist_label_v2.html)
- Seats: Open-Palm claim + cooldown + anchor snap; HUD uses aligned labels (flag) (source: dev/camera_landmarks_wrist_label_v2.html)
- Telemetry: v3 offline page has JSONL ring/export; v2 has export smokes (source: dev/gesture_tasks_offline_v3.html, tests)
- xstate available (^5.x) but not used yet (source: package.json)

## Timebox
20 minutes (source: defaults)

## Research Notes

- Add a no-op, feature-flagged dynamic import to avoid perf/behavior impact (source: files)
- Reuse existing seat IDs and anchors as FSM actor keys (source: files)
- Telemetry schema can match v3 JSONL ring when enabled behind the same flag (source: files)

## Tool Inventory

- Scripts: hex:e2e:v2:idle:jsonl; hex:telemetry:v3; hex:export:golden:* (source: package.json)
- Pages: v2 wrist HUD; v3 offline telemetry (source: files)
- Adapters: localStorageSettingsAdapter; shell OS winbox (source: src/adapters, src/ui)

## Options (Adopt-first)

1. Baseline — Keep v2 alignment + caching only; document limitation, no FSM.
   - Trade-offs: Easiest; residual edge cross may persist in rare reorderings.
2. Guarded extension — Add xstate per-seat FSM, feature-flagged; dynamic import; emit JSONL rows via existing ring.
   - Trade-offs: Minimal risk; extra bytes only when flag on; testable.
3. Minimal adapter — Pipe v2 labels into a small debouncer without statecharts.
   - Trade-offs: Less expressive; harder to extend to predictive/hold timers.

## Recommendation
Option 2: Guarded xstate per-seat FSM; safest and extensible.

## First Slice

- Create src/hex/gestureFsmSeat.js exporting createSeatGestureMachine (stub states: idle→active→idle).
- Wire v2 page with FEATURE_SEAT_FSM_PER_TRACK=false by default and dynamic import. Add WEBWAY markers.
- Add SRL/ADR logs and index entries.

## Guard & Flag

- Guard: hex:e2e:v2:idle:jsonl must pass with flag OFF.
- Flag: FEATURE_SEAT_FSM_PER_TRACK (URL ?FEATURE_SEAT_FSM_PER_TRACK=1 to enable).

## Industry Alignment

- Use XState v5 for deterministic, inspectable machines (source: xstate docs)
- Telemetry as JSONL for reproducible goldens (source: repo tests)

## Revert

- Delete src/hex/gestureFsmSeat.js and remove FEATURE_SEAT_FSM_PER_TRACK block from v2 page; remove WEBWAY markers; drop SRL/ADR entries.

## Follow-up

- TTL check: if unused by 2025-10-05, expire or promote to ready.
- Extend FSM to include clutch timers (hold/cooldown) and export per-seat JSONL rows.
