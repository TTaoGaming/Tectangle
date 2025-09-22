# ADR | 2025-09-20T00:00:00Z | ww-2025-081

Context: Goal is simple games and broad reach; need standard controller surface and a portable avatar with minimal invention.

Decision: Adopt WebXR input (emulated from seats/pinch) and VRM retargeting via Kalidokit behind flags. Keep physics optional (deferred) and rely on ghost persistence for occlusion stability.

Consequences: Rapid compatibility with web XR engines; reduced bespoke rigging; small test footprint (XR smoke). Physics complexity avoided until necessary.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-081_tool_virtualization_xr_adoption.md)
