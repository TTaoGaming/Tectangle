Three.js — Executive Two‑Pager
==============================

```yaml
title: "Three.js — Executive Two‑Pager"
doc_type: two-pager
timestamp: 2025-09-05T00:08:00Z
tags: [Three.js, rendering, overlay, debug]
summary: "Use Three.js to visualize rigs/landmarks and lightweight debug overlays; decouple render from physics/logic."
source_path: "September2025/PinchFSM/docs/two-pagers/ThreeJS_TwoPager_2025-09-05.md"
```

Timestamp: 2025-09-05T00:08:00Z  
Location: September2025/PinchFSM/docs/two-pagers/ThreeJS_TwoPager_2025-09-05.md

---

Page 1 — What/Why
-----------------

- Three.js is a WebGL renderer + scene graph abstraction widely used for 3D in the browser.
- Strengths: mature ecosystem, broad device support, good interop with physics (Rapier), debug helpers.
- Risks: mobile performance with high overdraw/draw calls; keep meshes simple and batch where possible.

Page 2 — How it applies here
----------------------------

- Use cases: hand rig visualization (bones as cylinders/lines), event overlays (ticks, predicted rays), interaction planes/keys.
- Structure:
  - Scene/camera/renderer setup; OrbitControls for debug; requestAnimationFrame render loop.
  - Render transforms driven by landmarks→rig (kinematic) or draw landmarks directly.
- Minimal contract:
  - Inputs: poses for wrist/palm/fingertips; overlay primitives (lines/ticks/text).
  - Outputs: rendered frame + optional HUD.
- Best practices: fixed physics timestep with separate render loop; frustum culling; low‑poly helpers; avoid layout thrash.
- Next step: tiny scene scaffold and line helper for thumb–index line + threshold ticks.
