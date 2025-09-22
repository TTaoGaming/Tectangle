Rapier — Tech → Application for PinchFSM
=======================================

Metadata
--------

- title: Rapier — Tech → Application
- doc_type: two-pager
- timestamp: 2025-09-05T00:06:00Z
- tags: [Rapier, physics, TOI, CCD, Three.js]
- summary: Use Rapier for contact/TOI and a minimal kinematic hand rig; keep deterministic PinchFSM as the primary input path.

Page 1 — What & why
-------------------

- Physics engine (WASM) with bodies/colliders/joints, CCD/TOI, queries; integrates cleanly with Three.js.
- Determinism: good on fixed platform with fixed dt/inputs; in CI compare events, not FP states.

Minimal API (JS)

- World: new RAPIER.World(gravity); step(dt)
- Bodies: dynamic/kinematic/fixed; setNextKinematicTranslation/Rotation
- Colliders: ball/capsule/box; Joints: revolute/ball/fixed/prismatic
- Queries: castShape, ray/shape casts, contacts

Page 2 — Application here
-------------------------

- Kinematic hand rig: wrist, palm, index MCP/tip, thumb MCP/tip (6–8 bodies); simple joints; fingertip colliders.
- Interaction plane/keys as colliders; contact or ε‑separation → events.
- Hybrid pinch: keep P = dist(4,8)/dist(5,17) + hysteresis; use contact to confirm/anchor.
- TOI look‑ahead for perceived timing; fixed dt; separate render loop.
- Config knobs: filters (OneEuro/Kalman), thresholds, physics (fixedDt, gravity, ccd per collider), interaction sizing.
- Phases: P0 physics spike → P1 hybrid pinch+TOI → P2 expanded rig/perf.

End.
