# ADR | 2025-09-20T00:00:00Z | ww-2025-096

Context: Users lost visual references during occlusion and seats inflated when new hands appeared while a seat awaited reacquire.
Decision: Add ghost visuals (last smoothed pose) for seated hands during occlusion; gate new seat claims while any seat is within lossGraceMs; align GestureRecognizer hands to detections by nearest wrist.
Consequences: Clear anchor context for reseat; fewer surprise seat jumps (e.g., P1 reassigning to P3); deterministic claim order. Minor extra state per seat (lastPose).
Links: [Webway note](../../../../scaffolds/webway_ww-2025-096_v2_camera_dual_viz.md)
