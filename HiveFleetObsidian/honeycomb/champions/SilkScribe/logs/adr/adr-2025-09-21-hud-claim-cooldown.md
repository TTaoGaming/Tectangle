# ADR | 2025-09-21T00:00:00Z | ww-2025-026

Context: Wrist HUD labels occasionally reflect the wrong hand; rapid lighting/motion can cause brief seat spikes (P3/P4). v2 demo already aligns recognizer to detector wrists.
Decision: Adopt per-hand aligned label for HUD and introduce a short seat claim cooldown (claimCooldownMs) with a score gate (labelScoreMin), both behind feature flags.
Consequences: HUD labels stabilize per track; new seat claims are rate-limited to reduce spikes. Flags allow A/B and rollback. No new deps; unit and overlay smokes pass.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-026-hud-claim-cooldown.md)
