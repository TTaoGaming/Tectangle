# Rapier Physics — Two‑Pager (Tech → Application)

Timestamp: 2025-09-04T23:59:55Z  
Location: `September2025/PinchFSM/docs/Rapier_TwoPager_2025-09-04T23-59-55Z.md`

---

## Page 1 — Technology overview (Rapier + Three.js)

What Rapier is

- Rapier is a high‑performance physics engine (Rust core, JS/WASM bindings: rapier2d/rapier3d) supporting rigid bodies (dynamic, kinematic, fixed), colliders, joints (revolute/hinge, spherical/ball, prismatic, fixed), continuous collision detection (CCD), time‑of‑impact (TOI) queries, ray casting, and contact events.
- It integrates well with WebGL/WebGPU renderers through Three.js: you simulate with Rapier and render with Three.

Key capabilities (practical)

- Bodies: create dynamic for physically simulated parts, kinematic for driven targets following external inputs (e.g., landmarks), and fixed for static world.
- Colliders: primitive shapes (spheres, capsules, boxes) and compound meshes for interaction and contact manifolds.
- Joints/constraints: connect bodies with limits and motors (e.g., hinge with angular limits) to model anatomy‑like constraints.
- CCD/TOI: prevent tunneling at high speeds and compute time to impact; sweep tests and shape casts help with predictive collision timing.
- Queries: ray casts, shape casts, intersection tests; narrow‑phase contact data includes penetration depths and normals.

Determinism & performance

- Determinism is strong on identical platforms/builds with fixed timesteps and identical inputs, but may vary cross‑platform due to floating‑point/WASM differences. For CI, record and replay input streams; compare downstream events, not raw FP math.
- Use a fixed physics timestep (e.g., 60 Hz) with an accumulator to decouple from rendering; enable CCD only where needed to save CPU.
- Favor simple colliders (capsules/spheres) and kinematic bodies for driven bones; keep joint graphs small for mobile.

What Rapier is not

- Not a dedicated Inverse Kinematics (IK) solver. You can implement IK (CCD, FABRIK) yourself or use a library (e.g., three‑ik) and feed the resulting target poses into Rapier as kinematic bodies or joint motors.

Minimal API feel (JS bindings)

- World setup: `const world = new RAPIER.World(gravity)`; step: `world.step(dt)`.
- Bodies: use `RigidBodyDesc.dynamic()` / `.kinematicPositionBased()`; create via `world.createRigidBody(desc)`.
- Colliders: `ColliderDesc.capsule/ball/cuboid`, attach with `world.createCollider(desc, body)`.
- Joints: `JointData.revolute/ball/fixed/prismatic` and `world.createImpulseJoint(jointData, a, b, true)`.
- Kinematic targets: `body.setNextKinematicTranslation/Rotation(...)` each step before `world.step`.
- Queries: `world.castShape`, `world.intersectionsWith`, `world.contactPair` and event queues.

When to use it

- You need contact‑based interactions, joint limits, constraints, or prediction (TOI/CCD) beyond pure geometric heuristics.
- You want a visual/physical hand rig or to emulate instrument surfaces/keys with colliders for richer feedback.

---

## Page 2 — Applying Rapier to your project (PinchFSM + 3D skeleton)

Approach (high level)

- Use hand landmarks as kinematic targets for a simplified hand skeleton (wrist, MCPs, tips). Smooth the inputs (One Euro / small Kalman) to reduce jitter. Drive kinematic bodies via `setNextKinematicTranslation/Rotation`, with joint constraints enforcing plausible anatomy.
- Use colliders on fingertips/thumb and an interaction plane/keys to derive contact events. Use TOI/CCD to anticipate contacts and reduce perceived latency. Keep a parallel deterministic PinchFSM path for robust Strike/Lift and testing.

Hand rig (minimal practical rig)

- Bodies: wrist (kinematic), palm (kinematic), index MCP and tip (kinematic), thumb MCP and tip (kinematic). Start with 6–8 bodies.
- Joints: fixed wrist→palm; ball or limited hinge for MCPs; optionally lock some DOF for stability.
- Colliders: small capsules/spheres on fingertips; a thin plane collider for the interaction surface (e.g., virtual keys); optional volumes for dead zones.
- Scaling: calibrate bone lengths from an initial landmark capture; store scale so kinematic targets match observed hand size.

Input smoothing & kinematic targets

- Smooth landmarks (per‑point One Euro / Kalman). Convert to 3D in world units (meters) with a consistent scale. Compute palm frame (wrist, index_mcp=5, pinky_mcp=17) to orient the rig.
- Each tick: set kinematic targets for wrist/palm, then MCPs and tips. Run `world.step(fixedDt)` using an accumulator; render Three.js from the resulting transforms.

Pinch detection and events

- Option A (contact‑based): consider pinch when tip colliders (thumb/index) contact or separation < ε on the rig; use contact manifold depth and relative velocity for Strike/Lift velocities.
- Option B (hybrid): maintain normalized P = dist(4,8)/dist(5,17) for determinism and use physics contact only as validation or anchoring.
- Use TOI queries (`castShape` or CCD) to predict imminent contact and schedule Strike with look‑ahead. Keep hysteresis and palm gating logic from your FSM to avoid chatter.

Interaction surfaces (examples)

- Piano keys: box colliders with springy response (visual only), contact begins Strike; key up when separation exceeds T_exit or contact ends for ≥ debounce.
- UI buttons: plane with regions; use ray or fingertip collider overlap; apply dead zones and palm gating.

IK considerations

- Rapier won’t solve IK; use a simple CCD/FABRIK solver to compute target fingertip/palm transforms from landmarks, then feed those to kinematic bodies. Alternatively, skip IK and directly map landmarks → kinematic targets if the landmark set is stable enough.

Determinism & testing

- Fix physics timestep (e.g., 1/60s), set the same gravity/params each run, and replay the same smoothed landmark stream to test determinism. Compare event timelines (Strike/Lift) rather than raw body states.
- For CI, prefer offline replay of recorded landmark traces into the physics loop. Avoid relying on live floating‑point equality.

Config knobs (starter set)

- filters: OneEuro preset or {minCutoff, beta}; kalman: on/off
- pinch: T_enter, T_exit, debounceMs; contactEpsilon; usePhysicsContact: true/false
- physics: fixedDt, gravity, ccd: on/off per collider; joint limits per finger
- interaction: key surfaces size/spacing; dead zones; palm gate thresholds

Phased plan

- P0: Physics spike — minimal hand rig (wrist, palm, index tip, thumb tip) as kinematic bodies; colliders + contact events; visualize in Three.js.
- P1: Hybrid pinch — contact‑validated FSM (keep normalized P + hysteresis; use contact to confirm/anchor); add TOI look‑ahead; tune stability.
- P2: Expanded rig — more fingers/joints, joint limits per anatomy, interaction surfaces (keys/buttons), telemetry; performance tuning for mobile.

Pros / Cons (summary)

- Pros: rich contact interactions; geometric TOI/CCD; natural collision‑based events; joint constraints emulate anatomy; good Three.js interop.
- Cons: higher complexity; performance cost on mobile; not a built‑in IK solution; determinism sensitive to FP/params; more calibration.

Decision guidance

- Use Rapier when you want contact‑driven interactions, spatial anchors, or “physical” feel. Keep the deterministic PinchFSM path for baseline input and CI replay. Adopt a hybrid: FSM for timing/guardrails; physics for interaction richness and visualization.

End.
