<!--
STIGMERGY KNOWLEDGE ROLLOVER
Generated: 2025-09-18T03:40Z
-->

# Root Knowledge Overview

## .github/
- **Role:** Copilot/AI guardrails for the TAGS monolith.
- **Keep:** `copilot-instructions.md` (diagnostics-first workflow, event bus usage, tag navigation).
- **Watchouts:** Move file with the hub so assistants stay aligned.
- **Carry into Hex:** Reference when onboarding AI tooling in new repos.

## .history/
- **Role:** Archived snapshots of prior root states.
- **Keep:** Time-stamped directories for forensic reference.
- **Watchouts:** Large footprint; keep outside active mining unless explicitly needed.
- **Carry into Hex:** Treat as archival-only; relocate if storage/noise becomes an issue.

## .kiro/
- **Role:** Strategy and steering specs (multi-hand isolation vs "magical first 30 seconds", pipeline wrapper plans, strangler initiatives).
- **Keep:** `specs/` analyses, steering notes, release plans.
- **Watchouts:** Ensure insights flow into ADRs so they do not drift.
- **Carry into Hex:** Use these option analyses to prioritise Hex backlog items.

## .kilocode/
- **Role:** Model Context Protocol server configuration.
- **Keep:** `mcp.json` (filesystem/sequential-thinking/time/memory/puppeteer servers) and `rules.md` guardrail against loading the full monolith.
- **Watchouts:** Update filesystem root if directory layout changes.
- **Carry into Hex:** Copy `.kilocode/` when relocating; document guardrail in ADR.

## .vscode/
- **Role:** Workspace defaults (Live Server port, spellchecker vocabulary, HTML settings).
- **Keep:** `settings.json`.
- **Watchouts:** Adjust only if tooling requirements change.
- **Carry into Hex:** Mirror settings to maintain consistent local tooling.

## archive/
- **Role:** July 2025 modularization archives (TAGS plan docs, strangler strategies).
- **Keep:** `ARCHITECTURAL-PLAN.md`, module summaries, strangler fig plans.
- **Watchouts:** Large and redundant; curate before copying.
- **Carry into Hex:** Feed module priority lists and wrapper plans into pinch/telemetry ADR backlog.

## archive-august-3-2025-physics-cleanup/
- **Role:** Physics cleanup slice consolidating clean MediaPipe baseline, offline dependency loader, and Jest-ready modular pipeline.
- **Keep:** `archive-clean-hand-tracking` minimal app, dependency loader scripts/manifests, Jest configs + module mocks, step1 physics pinch playground.
- **Watchouts:** Duplicated tests (`tests-duplicate/`), heavy `foundation/` monolith remains; curate before copying.
- **Carry into Hex:** Reuse dependency loader/test setup for offline Hex builds; adopt status UI/FPS telemetry; port pinch-to-keyboard mapping for Hex pinch tests.

## archive-working-TAGS-MVP-Modular-Monolith/
- **Role:** Working production monolith with bridge services, diagnostic harnesses, and event-driven core.
- **Keep:** `index-modular-monolith.html`, universal keyboard/macro bridges, hijack diagnostic tests, folder organization blueprint.
- **Watchouts:** Huge file size (3MB) and overlapping docs with other archives; extract selectively.
- **Carry into Hex:** Use bridges/diagnostics to validate Hex adapters; apply organization plan when splitting production vs archive assets.

## August Tectangle Sprint/
- **Role:** August 2025 strategy sprint aligning shareable demo with offline pipeline.
- **Keep:** `Overall Vision.md`, `integration-spec.md`, `workspace-and-vision.md`.
- **Watchouts:** Requires explicit distribution choice (PWA vs APK) and ADR follow-up.
- **Carry into Hex:** Adopt skeleton schema, pinch event contract, phased rollout plan (see `knowledge_summaries/august-tectangle-sprint-summary.md`).

## hand-physics-playground/
- **Role:** Physics playground with audio/speech managers and step1 demo suites.
- **Keep:** `game.js`, `audioManager.js`, `SpeechManager.js`, step1 physics demos/tests, setup docs.
- **Watchouts:** Archived `.git_archived`; curate before import.
- **Carry into Hex:** Reuse managers/tests for Hex physics regression and UI telemetry patterns.

## handsfree/
- **Role:** Mobile gesture instrument + camera-MPE production pipeline (orientation-aware MIDI, interactive projector, mobile pinch loops).
- **Keep:** `PRODUCTION-CLEANUP.md`, orientation MIDI mapping, gesture instrument UI.
- **Watchouts:** Detached HEAD, untracked files, large vendor bundles.
- **Carry into Hex:** Adopt pipeline modularisation, telemetry hooks, and mobile UX heuristics.

## hope-ai/
- **Role:** Collaboration toolkit (patterns, tools, memory-bank) enabling SRL + multi-agent orchestration.
- **Keep:** Behavioural settings (`hope-ai-core.md`), tool directory (`tools/`), memory-bank taxonomy.
- **Watchouts:** Needs active SRL/ADR adoption; ensure toolkit stays in sync.
- **Carry into Hex:** Use routines as base for parallel agent orchestration and shared blackboard discipline.

## Knowledge backup 20250417/
- **Role:** Legacy drumpad playbooks capturing deterministic pinch heuristics and expression mapping.
- **Keep:** `MDP_AI_CODING_GUIDE.md`, `4_RECTANGLE_GUIDE.md`, `REACT_REFERENCE_20250417.md`, etc.
- **Watchouts:** Documentation only; verify alignment with current implementation.
- **Carry into Hex:** Feed heuristics into `pinch_stability` & `expression_systems` boards.

## mvp/
- **Role:** Offline-first MVP demos (dependency checker, 2D/3D hand tracking, physics prototype).
- **Keep:** Dependency checker, simple and 3D demo HTML, physics implementation summaries.
- **Watchouts:** Ensure `/offline-dependencies/` bundle stays consistent.
- **Carry into Hex:** Reuse dependency checker and physics plan for Hex onboarding.

## offline-dependencies/
- **Role:** Central bundle supplying MediaPipe Hands, Three.js, and physics libraries.
- **Keep:** All wasm/tflite assets, Three.js builds, Oimo/Cannon libs, blueprint doc.
- **Watchouts:** Maintain directory layout for scripts referencing relative paths.
- **Carry into Hex:** Pair with dependency checker to validate offline readiness.

## Spatial Anchor MPE v25.7.10/
- **Role:** TAGS modular monolith + current camera builds (anchor + telemetry reference).
- **Keep:** `index-modular-monolith.html`, `camera-MPE-current` pipeline, backups documenting anchor/telemetry behaviour.
- **Watchouts:** Duplicate archives, deleted `.history` markers, detached git states.
- **Carry into Hex:** Anchor interaction patterns, orientation telemetry schema, ADR-Jul/Jun notes for event parity.

## Stigmergy_6Month_Knowledge_Extraction_2025-09-17T08-32-43Z/
- **Role:** Current hub (plan, manifest, blackboards, rollups, metrics, scripts).
- **Keep:** Entire structure; relocate as cohesive unit when moving repos.
- **Watchouts:** Outstanding ADRs for relocation and knowledge linkage.
- **Carry into Hex:** Serves as portable knowledge hub template.

## Tectangle Project folder/
- **Role:** Primary drumpad/ECS experimentation ground (~1M LOC).
- **Keep:** Modular ECS patterns, Tailwind component system, event-bus wiring, telemetry backlog items, sample-pack integration strategies.
- **Watchouts:** Restart syndrome, drag-and-drop git corruption, mixed-in asset archives.
- **Carry into Hex:** Event-driven ECS lessons, UI calibration flows, ADR backlog for React hex agents, asset decoupling plan.

## TAGS-AI-Optimized/
- **Role:** AI-assisted refactor plan with phased roadmap and Phase 1 testing harnesses.
- **Keep:** Phase1 modules/tests, development blueprints, AI audit guardrails.
- **Watchouts:** Ensure ADR captures restart guardrails; avoid duplicate docs.
- **Carry into Hex:** Adopt phased roadmap, golden master/Jest harness, restart rules.

## Tectangle code backups/
- **Role:** Early ModularDrumpad snapshots (Jan–Apr 2025) with OpenCV glue; ~45k LOC backup lines.
- **Keep:** OpenCV/MarkerMeasure modules, historical UI tabs, audio config references.
- **Watchouts:** Lack of metadata, duplicate bundles, no build instructions.
- **Carry into Hex:** Use as read-only reference for heuristics already captured in boards.

## August Tectangle Sprint/
- **Role:** August 2025 strategy sprint aligning shareable demo with offline pipeline.
- **Keep:** `Overall Vision.md`, `integration-spec.md`, `workspace-and-vision.md`.
- **Watchouts:** Requires explicit distribution choice (PWA vs APK) and ADR follow-up.
- **Carry into Hex:** Adopt skeleton schema, pinch event contract, phased rollout plan.

## hand-physics-playground/
- **Role:** Physics playground with audio/speech managers and step1 demo suite.
- **Keep:** `game.js`, managers, step1 demos/tests, docs.
- **Watchouts:** Archived `.git_archived`; curate before import.
- **Carry into Hex:** Reuse managers/tests for Hex physics regression.

## Remaining Assets
- **notes for ai coding plans/** – Refactoring plan integrated into backlog (stage for future ADRs).
- **Single-file artefacts** (`Mindstream AI pdf`, `tommy-notes.txt`) – Archived for historical context; no additional mining required.
- **.history/** – Tagged as archival-only; no further extraction planned.

---

## Migration Checklist
1. **SRL & ADR Discipline**
   - Maintain daily logs under `rollups/`; backfill ADRs for major milestones.
2. **Git Hygiene**
   - Re-clone repos when moving; archive broken `.git` states but work from fresh clones.
3. **Telemetry & Testing**
   - Outstanding backlog: instrumentation for camera-MPE + automated testing for Replit builds.
4. **Asset Strategy**
   - Keep heavy audio/sample libraries external or under dedicated storage service; ensure manifests note their location.
5. **.history Decision**
   - `.history/` marked as archival-only; relocate if it becomes noise.

With this overview, the Stigmergy hub is ready to move across repos with knowledge, metrics, and workflows intact.
