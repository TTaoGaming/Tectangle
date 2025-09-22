# ADR | 2025-09-21T00:00:00Z | ww-2025-108

Context: GestureShell OS uses XState for GateFSM; occasional stalls warrant a watchdog and visible stale indicator.
Decision: Add feature-flagged watchdog (default 1000ms) resetting to idle and marking context.stale=true; inspector shows ageMs and stale badge.
Consequences: Better operator feedback and self-recovery; minimal risk of masking upstream stalls; fully reversible behind flag.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-108-fsm-watchdog.md)
