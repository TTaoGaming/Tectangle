# Hex Hands — Video Goldens (v1)

This folder contains short MP4s used as goldens for MediaPipe→PinchCore validation. Each file name encodes intent; this README documents exact expectations for humans and machines.

## Summary

- Core detector: index–thumb pinch with palm-gate and orientation cone.
- Defaults: enter=0.40, exit=0.70, cone=25–30°, palmGate=true, speculative=true.
- Assertions per clip are in the manifest below (downs/ups/gate, and negative cases).

## Golden set (standardized names)

Run to prepare canonical copies:

```powershell
npm run -s hex:videos:prepare-goldens
```

Results (under `videos/golden/`):

- `golden.two_hands_pinch_seq.v1.mp4` — two-hands sequence Right pinch then Left; Expectation: P1 and P2 both lock; enriched telemetry present post-lock.
- `golden.two_hands_idle.v1.mp4` — two-hands idle; Expectation: no seat locks; no pinches.

## Manifest (parseable)

```json
[
  {
    "file": "right_hand_palm_facing_camera_index_pinch_v1.mp4",
    "hand": "Right",
    "pose": "palm_facing_camera",
    "action": "index_to_thumb_pinch",
    "gateExpected": true,
    "assert": {
      "framesMin": 20,
      "downsMin": 1,
      "upsMin": 1,
      "notes": "If first frame is already Pinched, allow FIRST_PINCH_IS_DOWN to count initial state."
    }
  },
  {
    "file": "right_hand_palm_left_index_pinch_v1.mp4",
    "hand": "Right",
    "pose": "palm_left",
    "action": "index_to_thumb_pinch",
    "gateExpected": true,
    "assert": {
      "framesMin": 20,
      "downsMin": 1,
      "upsMin": 1,
      "tuning": { "coneDegMin": 40 }
    }
  },
  {
    "file": "right_hand_pinch_gated_v1.mp4",
    "hand": "Right",
    "pose": "palm_off_cone_or_gate_blocked",
    "action": "approach_no_activation",
    "gateExpected": false,
    "assert": { "framesMin": 20, "downs": 0, "ups": 0 }
  },
  {
    "file": "right_hand_track_lr_ud_v1.mp4",
    "hand": "Right",
    "pose": "palm_neutral",
    "action": "track_only",
    "gateExpected": true,
    "assert": { "framesMin": 30, "downs": 0, "ups": 0 }
  },
  {
    "file": "right_hand_zsweep_close_to_far_v1.mp4",
    "hand": "Right",
    "pose": "z_sweep",
    "action": "depth_motion_no_pinch",
    "gateExpected": true,
    "assert": { "framesMin": 20, "downs": 0, "ups": 0 }
  },
  {
    "file": "right_hand_chords_seq_and_pairs_v1.mp4",
    "hand": "Right",
    "pose": "varied_fingers",
    "action": "chords_not_index_thumb",
    "gateExpected": true,
    "assert": { "framesMin": 20, "downs": 0, "ups": 0, "notes": "Core detects only index–thumb for now." }
  },
  {
    "file": "right_hand_crossover_exit_occlusion_no_pinch_v1.mp4",
    "hand": "Right",
    "pose": "crossover_exit_occlusion_reset",
    "action": "no_pinch",
    "gateExpected": "varies",
    "assert": { "framesMin": 10, "downs": 0, "ups": 0, "notes": "Includes mid-run crossover of two hands before exit/occlusion; used for ID stability without pinch." }
  },
  {
    "file": "two_hands_baseline_idle_v1.mp4",
    "hand": "Both",
    "pose": "idle",
    "action": "no_motion",
    "gateExpected": true,
    "assert": { "framesMin": 20, "downs": 0, "ups": 0 }
  }
]
```

## Notes and pitfalls

- If the first detected frame is already Pinched with gate=true, the core may not emit a `pinch:down`. Test harness can treat FIRST_PINCH_IS_DOWN=true for automation to count that as one down.
- Some MP4s may need H.264 + Range-enabled serving; our collector includes a fallback (seek-and-detect) to ensure frames are produced.
- Orientation sensitivity: for palm angles near the cone edge, set cone to ≥40° for palm-left clips.

## Quick expectations (human)

- palm_facing_camera_index_pinch: should fire Right pinch (down+up).
- palm_left_index_pinch: should fire Right pinch (down+up) with wider cone.
- pinch_gated: no activation; gate blocks.
- track_lr_ud, z_sweep, chords, exit_occlusion_reset, two_hands_idle: no pinch.
