# ADR | 2025-09-20T03:15:00Z | ww-2025-068

Context: Seat magnet visualization exists (anchors, proposals) but autosnap behavior is missing and UI-local. We need persistent anchors, singleton seats, and autosnap within a long window to reduce friction and identity flips.

Decision: Introduce a pure hex manager `src/app/seatMagnetManager.js` that tracks anchors and seat assignments, autosnapping unseated wrists within a capture radius and time window. Wire behind `?seatmag_auto=1` and gate via e2e.

Consequences: Cleaner boundary; reversible flag; measurable behavior (e2e). Requires minor v7 wiring and a new guard; potential tuning of radius/window.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-068_seat_magnet_autosnap.md)
