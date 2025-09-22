# ADR | 2025-09-19T09:02:00Z | ww-2025-080

Context: Need to verify Dino sidecar behavior on the v5 demo using the golden pinch MP4 and quantify events; prior e2e run was blocked by a port conflict.

Decision: Ran the dedicated v5 smoke script against the existing static server (port 8091) with dino=1&launch=1&autostart=1 to align manual and test behavior. Accepted the observed counts as ground truth for this clip today.

Consequences: Dino sidecar produced downs=1, ups=0, seat=P1, rejectedBySeat=0; SDK probe also saw downs=1, ups=0. Manual parity can be improved by enabling FEATURE_SIDECAR_DINO_LAUNCH_ATTACH. Keep the e2e guard (downs>0 and probe.downs>=1) active.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-080-sdkv5-dino-discrepancy.md)
