<!--
STIGMERGY SUMMARY HEADER
Source: TAGS-AI-Optimized/
Generated: 2025-09-18T02:35Z
-->

# TAGS AI-Optimized Summary (Phased Rebuild)

## Strategic Artifacts
- `docs/README-TAGS-BLUEPRINT.md` lays out six-phase roadmap from single-file MVP to projector-enabled medical trainer (Phase 1 ? Phase 6), with gesture scope, IK smoothing, and distribution options per phase.
- `docs/COMPONENT-DEVELOPMENT-PLAN.md` and `docs/TAGS-System-Architecture.md` map each monolith subsystem into modular components (Camera, IK, Gesture, KeyboardBridge, Visualization) with ownership and stabilization status.
- `ai-audit2.md` captures failure analysis of 31 restarts and prescribes guardrails: ADR-before-restart, deterministic testing, AI role separation.

## Phase 1 Toolkit (phase1/)
- Production-grade testing harness: Jest + JSDOM configs, Cypress setup, golden master/diagnostic HTML runners, one-click scripts, and module testers with explicit instructions in `SIMPLIFIED_TESTING_GUIDE.md` and `COMPREHENSIVE_TESTING_GUIDE.md`.
- Modular JS components (`SimpleHandTracker`, `HandTrackingIntegration`, `ThreeJSVisualization`, `WristPositionTracker`, `DebugDisplay`) ready for extraction into Hex packages.
- Automated wrappers (`run-simple-tests.js`, `automated-tests.js`) orchestrate Jest + golden master flows; `MODULAR_INTEGRATION_VALIDATION.md` outlines contractor-style acceptance checks.

## Phase Deliverables & Requirements
- Phase 1 spec locks camera?gesture?keyboard flow, 30 FPS target, simple IK smoothing, and five canonical gestures with associated input mappings.
- Subsequent phases add Piano Genie bridge, gesture vocabulary, projector integration, culminating in medical training kit; each phase includes dependency lists, risk flags, and acceptance tests.
- Blueprints emphasise offline distribution (APK + sideload), 480p constraint, and accessible device targets.

## Action Hooks
1. Lift `phase1/` testing harness (Jest/Cypress/golden master) into Hex repo to enforce deterministic regression gates.
2. Create ADR `ADR-2025-08-TAGS-AI-Optimized-Roadmap` capturing phased rollout and testing obligations.
3. Import `SimpleHandTracker.js` + `ThreeJSVisualization.js` as seeds for Hex skeleton module; preserve debug UI patterns.

## Follow-On Tasks
- Port Piano Genie bridge integration after pinch core stabilized.
- Mirror restart-avoidance rules from `ai-audit2.md` into team agreements.
- Map each roadmap phase to planned SRL cycles for easier progress tracking.
