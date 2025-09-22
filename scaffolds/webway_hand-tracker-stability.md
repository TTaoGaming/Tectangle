---
id: ww-2025-002
owner: @ttao
status: active
expires_on: 2025-10-06
guard: e2e(hand_id_stability) maxTeleportRate<=0.15
flag: FEATURE_HEX_HAND_TRACKER_T1_STABILITY
revert: remove file + flag references
---
# Webway: Hand Tracker Stability (Seat Lock & Drift Reduction)
Goal: Prevent unwanted seat/hand label teleport when a real hand crosses center slowly.
Proven path: Build on ww-2025-001 (Tier-1 tracker) adding seat lock & hysteresis.
Files touched (planned): src/ports/handTrackerT1.js, src/ports/mediapipe.js, dev/canned_hand_id_test_prototype.html
Markers: WEBWAY:ww-2025-002:
Next steps:
1. Add stableSeat per track decoupled from transient label.
2. Introduce crossing hysteresis window (center band) before seat swap.
3. Track jump class metrics (minor|major|teleport) to refine thresholds.
4. Update lab with seat lock toggle & center band visualization.
5. Add e2e regression asserting no seat swaps during controlled slow cross clip.
