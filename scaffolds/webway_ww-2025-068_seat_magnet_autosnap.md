---
id: ww-2025-068
owner: @TTaoGaming
status: active
expires_on: 2025-10-04
guard: hex:seatmag-autosnap-e2e (autosnap within window; singleton seats)
flag: seatmag_auto
revert: remove port/flag
---
# Webway: Seat Magnet Autosnap (hex manager)

## Goal

Implement a hex-architecture Seat Magnet Manager that maintains persistent seat anchors and autosnaps an entering wrist to the prior seat within a long time window, enforcing singleton seats and max concurrent seats.

## Constraints

- Timebox: 20m scoping; 1–2h per slice (source: defaults)
- Perf: ≤ 200ms/frame; manager pure logic, O(n) detections (source: defaults)
- Privacy/Sec: no exfil; local only (source: defaults)
- CI: must pass; do not break existing v5/v6/v7 demos (source: defaults)

## Current Map

- Visualization-only seat magnet exists in `dev/src/overlay/hand_overlay.js` (flag `?seatmag=1`) showing anchors, wrist-only unseated, and proximity proposals (source: repo)
- Strips refactored to seats-only in v7 demo; FINGER_ATLAS recorder and golden regression are green (source: tests)
- No autosnap logic in hex; seat assignment remains UI-local (source: repo)

## Timebox

- timebox_minutes: 20 (source: defaults)

## Research Notes

- Anchors: set from wrist when seated; TTL window governs autosnap validity (source: industry, UI overlay)
- Policies: singleton seats, maxSeats guard, radius capture threshold in normalized UV (source: design)
- Precedents: AR apps reuse last pose anchor to recover tracking quickly; minimizing UI jitter (source: industry)
- Repo signals: Jest+Puppeteer goldens available; flags pattern established (FINGER_ATLAS, seatmag) (source: repo)

## Tool Inventory

- Tests: Jest+Puppeteer golden-master, UI snapshots; tasks: Hex Tier gates, golden smokes (source: package.json/tasks)
- Datasets: golden.two_hands_pinch_seq.v1.mp4, golden.two_hands_idle.v1.mp4 (source: repo)
- Ports: new `src/app/seatMagnetManager.js` (pure) (source: this slice)

## Options (Adopt-first)

1. Baseline — Keep visualization-only
   - Keep proposals UI; defer logic to a later hex port.
   - Trade-offs: Safe but no behavior improvement; user friction remains.
2. Guarded extension — Hex manager + minimal wiring (flagged)
   - Implement pure manager with autosnap window and singleton enforcement; wire v7 via query `?seatmag=1&seatmag_auto=1` to consume assignments; add e2e guard.
   - Trade-offs: Small UI touch; measurable improvement with reversible flag.
3. Minimal adapter — Bridge UI overlay to port
   - Create small adapter that reads manager state and annotates overlay; keep UI behavior unchanged.
   - Trade-offs: Extra indirection; still requires later wiring.

## Recommendation

Option 2 because it adds value now with low risk: pure logic module, flagged integration, and a CI guard that asserts autosnap within window without changing default behavior.

## First Slice

- Added hex manager: `September2025/TectangleHexagonal/src/app/seatMagnetManager.js` with autosnap window, radius, singleton seats, and events. WEBWAY:ww-2025-068 marker present.
- Next: wire v7 demo behind `seatmag_auto` flag to call manager.onFrame() and apply seat assignments; add golden e2e test: autosnap within window and no autosnap after window.

## Guard & Flag

- Guard: hex:seatmag-autosnap-e2e — run golden pinch; unseat then re-enter within window → expect reassignment; after window → no reassignment.
- Flag: seatmag_auto; activated via `?seatmag=1&seatmag_auto=1`.

## Industry Alignment

- Persistent anchors and capture radii are common in AR/VR hand tracking for continuity.
- Singleton ownership prevents cross-talk and identity flips.

## Revert

- Remove manager file and wiring; delete e2e guard; keep overlay proposals only.

## Follow-up

- TTL check and UI hint when window expires; require confirm gesture in zone.
- Calibration “sigils” to bias anchors and improve recovery confidence.
