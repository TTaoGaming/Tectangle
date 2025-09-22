Steward - Guardrail Examples

Pick one sentence that stabilizes behavior without blocking progress.

Examples
- Debounce 60 ms; release at 55% threshold; clamp velocity spikes.
- Drop frames with missing timestamps; require monotonic frame times.
- Feature flag: enable_new_path=false by default; log both paths.
- Hysteresis: require two consecutive positives before trigger.
- Ordering: initialize sensors before starting inference; retry x3 with backoff.

Rollback
- Make guardrails easy to disable via a single flag or config.

