# Agent contract - PinchFSM Trace Generation

Scope

- Generate deterministic hand landmark traces from provided MP4 inputs.
- Validate and commit JSON outputs and meta with checksums.
- Compare runs against goldens and open PRs when deltas exceed thresholds.

Inputs

- MP4 videos placed relative to repo root.

Outputs

- data/goldens/{basename}.landmarks.json
- data/goldens/{basename}.meta.json
- data/goldens/{basename}.golden_times.json

Acceptance thresholds

- Median |Δt| ≤ 40ms; p90 ≤ 100ms vs golden_times
- False positives ≤ 5%

Runbook

- Ensure ffmpeg available in PATH.
- Run trace generator for each input.
- Stage and commit outputs; include meta with asset hashes.
- For comparisons, generate reports/*.comparison.json and attach to PR.
