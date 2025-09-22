# ADR | 2025-09-21T00:00:00Z | ww-2025-107

Context: We need to eliminate wrist HUD cross-contamination and formalize seat assignment without destabilizing the existing v2 page. The user requested a cloned “GestureShellOS” with a SeatManager behind a feature flag and new e2e guards.
Decision: Create a new GSOS page cloned from v2; add SeatManager v1 (claim/hold/reacquire/release) behind FEATURE_SEAT_MANAGER_V1; add idle label stability and seat transitions e2e tests; keep v2 unchanged.
Consequences: Safer iteration and quick revert; guards ensure no regressions. Future integration with KeyMap (WW-104), SDK/API v0 (WW-105), and GameBridge Dual Dino (WW-106).
Links: [Webway note](../../../../scaffolds/webway_ww-2025-107-gesture-shell-os.md)
