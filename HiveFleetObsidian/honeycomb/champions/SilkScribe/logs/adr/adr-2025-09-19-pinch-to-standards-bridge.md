# ADR | 2025-09-19T00:00:00Z | ww-2025-082

Context: We have a robust, palm-gated pinch with Kalman/hysteresis/angle/velocity confirmation and a seat magnet ghost for persistence. We want to reuse this with industry standards.

Decision: Add a guarded Pinch → Standards Bridge. First implement an XR emulation adapter that emits WebXR-like select/selectend and exposes P1 curl; then add a minimal VRM retarget via Kalidokit and optional MPE mapping. All behind FEATURE_PINCH_STANDARDS_BRIDGE (sub: FEATURE_XR_EMU, FEATURE_VRM, FEATURE_MPE_BRIDGE).

Consequences: Keeps our logic, increases reach to XR/avatars/DAWs with minimal code. Small deps for VRM/MIDI. Clear revert via flag removal.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-082_pinch_to_standards_bridge.md)
