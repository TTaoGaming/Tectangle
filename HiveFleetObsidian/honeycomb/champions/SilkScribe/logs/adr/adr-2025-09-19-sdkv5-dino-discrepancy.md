# ADR | 2025-09-19T00:00:00Z | ww-2025-080

Context: E2E uses URL flags to attach Dino sidecar and probe SDK typed events; manual demo relied on clicking Launch Dino only, which did not call sidecar.attach. Facade typed on() is now correct, so primary discrepancy is demo wiring.

Decision: Add a guarded option to attach sidecar on Launch button (FEATURE_SIDECAR_DINO_LAUNCH_ATTACH). Keep fail-fast e2e guard that asserts downs>0 and probe>=1. Document manual URL for parity.

Consequences: Manual verifications match tests when flag enabled; focus/autoplay retries continue to de-flake iframe input. Revert by disabling the flag.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-080-sdkv5-dino-discrepancy.md)
