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

---
tags: [Tectangle, Hexagonal, Notes, TOI, Lookahead]
created: 2025-09-13T22:40:00Z
stale_after: 2025-10-13
---

# TOI Lookahead + Geometry Gate — Notes (2025-09-13)

1. Joint angle checks

- Compute MediaPipe 21-pt joint angles per finger (PIP/DIP; thumb CMC/MCP/IP).
- Gate “straight fingers” by small bend (e.g., < 25° total at PIP/DIP).

1. Bone ratio hand ID

- Normalize phalanx lengths by average MCP→PIP across fingers.
- Hash the vector as controller ID; compute only when palm faces camera and fingers straight.
- Use to rebind identity when hand re-enters frame.

1. 1D Kalman lookahead for TOI

- Track normalized tip distance (index↔thumb) via 1D Kalman (x,v).
- User knob: lookaheadMs. Show “ghost” dot = x(t+lookaheadMs) in hysteresis tube.
- Use ghost vs enter/exit for pinch detection (hysteresis crossing).

Implementation breadcrumbs

- src/core/handGeometry.js: angles, palm angle, straightness, bone ratio ID.
- src/core/kalman1d.js: x,v filter with lookahead(ms).
- Demo: add user knob (ms), draw ghost dot, optionally gate pinch by ghost crossing.

Risks

- Calibration drift across devices; need per-session stabilization and limits.
- MediaPipe handedness flips; ID hash helps, but watch for mirror.

## Orientation-gated palm width LUT and dynamic Z-slices

- Goal: distance invariance across depth and palm orientation while keeping latency low.
- Build a per-hand LUT: key by (handId, palmAngleBucket, wristRollBucket). Value stores robust palm width proxy (e.g., MCP span, averaged).
- Use LUT to derive dynamic Z-slices: estimate relative depth scale sZ = f(palmWidthObserved / palmWidthCanonical).
- Normalize fingertip distances by sZ instead of raw knuckle span; improves cross-depth consistency for enter/exit thresholds.
- Orientation gate: only update LUT when palm within a cone (front-facing, low skew) and fingers straight (geometry gate) to reduce noise.
- Per-hand isolation: maintain LUT/state per controllerId (bone-ratio hash) to avoid bleed in multiplayer; never mix samples across IDs.
- Startup: seed with conservative defaults; warm quickly with EMA when gated samples arrive; persist for session only.
- Fallback: if orientation not in LUT, interpolate nearest buckets; clamp scale to sane bounds.

Implementation hints

- Extend `handGeometry.computePalmAngle` + add wrist roll; bucket with small step (e.g., 10°).
- Add `scaleDepth(frame)` helper inside per-hand tracker: returns sZ and updates LUT when gated.
- Wire `createPlausibility` normalization to prefer sZ over static knuckle span when available.
