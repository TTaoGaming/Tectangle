# Three.js — Executive Two‑Pager

Timestamp: 2025-09-04T23:59:56Z
Location: `September2025/PinchFSM/docs/ThreeJS_TwoPager_2025-09-04T23-59-56Z.md`

---

## Page 1 — What/Why

- Three.js is a WebGL renderer + scene graph abstraction widely used for 3D in the browser. It provides cameras, lights, materials, meshes, and helpers.
- Strengths: mature, huge ecosystem, works everywhere, integrates with physics (Rapier), UI overlays, and postprocessing.
- Fit here: visualize hand rigs, draw landmark overlays, and render interaction surfaces (keys/buttons). Good for lightweight debug UIs with Canvas2D + Three overlay.
- Risks: performance on mobile if overdraw or too many draw calls; keep meshes simple and batching where possible.

## Page 2 — How it applies here

- Use Three.js for: hand rig visualization (bones as cylinders/lines), event overlays (ticks, predicted rays), and interaction surfaces.
- Structure:
  - Scene/camera/renderer setup; OrbitControls for debug; requestAnimationFrame render loop.
  - Render transforms driven by either landmarks→rig (kinematic) or directly draw landmarks.
- Minimal contract:
  - Inputs: pose (position/quaternion) for wrist/palm/fingertips; overlay primitives (lines, ticks).
  - Outputs: rendered frame; debug HUD.
- Best practices: fixed physics timestep with separate render loop; frustum culling on; low-poly helpers.
- Next step: add a tiny scene scaffold and line helpers for thumb–index line + ticks.
