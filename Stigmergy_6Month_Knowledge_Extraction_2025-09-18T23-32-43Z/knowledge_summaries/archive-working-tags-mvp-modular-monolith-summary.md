<!--
STIGMERGY SUMMARY HEADER
Source: archive-working-TAGS-MVP-Modular-Monolith/
Generated: 2025-09-18T02:55Z
-->

# TAGS Working Modular Monolith Summary

## Core Assets
- `index-modular-monolith.html` (3.1MB, 29k lines) – production system with AI headers, event-driven architecture, and standardized settings.
- `FOLDER-ORGANIZATION-PLAN.md` – proposal to split production, testing, tooling, docs, assets, integrations, and archive layers for maintainability.
- Diagnostic + test utilities (`test-*`, `console-camera-reality-check.js`, `webcam-hijacking-commands.js`) verifying camera hijack mitigations, keyboard/macro bridges, and module health.
- Bridges (`universal-keyboard-bridge.js`, `universal-macro-bridge.js`) and service scripts enabling external control layers.

## Key Learnings
1. **Event & Settings Discipline** – 60+ calls to `gcFreeOrchestrator.emit` and 70+ `UnifiedSettingsManager` operations; use as reference for Hex event schema.
2. **Testing Arsenal** – HTML-based diagnostic runners, automated scripts, and hijack tests provide ready-made regression kits for camera/MIDI bridges.
3. **Organization Blueprint** – Proposed folder breakdown clarifies how to separate production core, tests, tooling, docs, assets, and archives; aligns with our current hub migration goals.
4. **Security & Stability** – Hijacking tests (console, webcam) catch unauthorized camera access; universal bridges centralize input/output gating.
5. **AI Documentation** – AI-optimized structure doc summarises monolith modules and dependencies; helpful when planning selective porting versus whole-sale import.

## Action Hooks
- Capture `universal-keyboard-bridge.js` + `universal-macro-bridge.js` APIs in telemetry/expression boards for future adapter work.
- Port hijack/diagnostic tests into Hex regression suite.
- Use folder organization plan when carving out production vs archive artifacts for the hub move.

## Follow-On Tasks
- Decide which monolith modules migrate to Hex vs stay archival; record in future ADR.
- Link key diagnostic runners in `scripts/` or testing docs for quick activation.
- Reference AI header/version constants before any targeted extraction from the monolith.
