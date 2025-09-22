<!--
STIGMERGY SUMMARY HEADER
Source: mvp/
Generated: 2025-09-18T03:15Z
-->

# MVP Hand Tracking Summary

## Core Artifacts
- `dependency-checker.html` – offline dependency validator covering 11+ MediaPipe/Three.js assets with gating for 2D/3D demos.
- `simple-hand-tracking.html` & `simple-3d-hand-tracking.html` – baseline 2D overlay and Three.js visualization demos rooted in offline assets.
- `physics-aware-hand-tracking.html` & `physics-test.html` – MVP physics integration prototypes with pinch-to-event scaffolding.
- Support docs (`OFFLINE-SETUP-COMPLETE.md`, `PHYSICS-IMPLEMENTATION-SUMMARY.md`, `hand-physics-hybrid-plan.md`, `WORKING-FILES-STATUS.md`) outlining setup, hybrid plan, and status snapshots.

## Key Learnings
1. **Offline First** – Dependency checker ensures full offline bundle (~13MB) before unlocking demos; re-use for Hex offline validation scripts.
2. **Progressive Demos** – 2D -> 3D -> physics pipeline shows incremental complexity pattern suitable for onboarding.
3. **Physics Hybrid Plan** – Documents bridging pure hand tracking with Oimo physics integration for pinch-based controls.
4. **Testing & Status** – MVP includes physics-aware test pages and status logs ideal for quick regression checks.

## Action Hooks
- Incorporate dependency-checker logic into Hex CI/offline distribution tooling.
- Use physics implementation summary as reference when defining Hex pinch physics module.
- Copy troubleshooting/offline setup steps into onboarding docs.

## Follow-On Tasks
- Run physics demo against current offline dependencies to verify they still align with `archive-august-3-2025-physics-cleanup` assets.
- Fold MVP dependency checklist into future ADR covering offline readiness.
