# ADR | 2025-09-21T00:00:00Z | ww-2025-122

Context: GSOS camera not auto-open; tests waited for top-level \_\_cam/#fps and timed out under MP4 shim.
Decision: Update GSOS idle e2e to open camera via \_\_gso.openApp('camera'), disable wallpaper, and target the camera iframe for readiness/sampling.
Consequences: Test becomes resilient to default card list changes; avoids false negatives; no runtime behavior change.
Links: [Webway note](../../../../scaffolds/webway_gsos_mp4_iframe_probe.md)
