# ADR | 2025-09-21T00:00:00Z | ww-2025-120

Context: GSOS forwards top-level query params to camera iframes (v13/v2). v13 respects clip and autostart. Without autostart, CI golden clips may require a click.
Decision: Append autostart=1 when clip= is present and no auto/autostart is set, guarded by FEATURE_GSOS_AUTOSTART_ON_CLIP (default ON). Place WEBWAY:ww-2025-120 markers near logic.
Consequences: Deterministic playback for guards; reversible via ?FEATURE_GSOS_AUTOSTART_ON_CLIP=0; no impact to live camera paths.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-120-autostart-forwarding.md)
