<!--
STIGMERGY SUMMARY HEADER
Source: archive/
Generated: 2025-09-18T01:50Z
-->

# Archive Root Summary (July 2025 Modularization Wave)

## High-Value Artifacts
- `ARCHITECTURAL-PLAN.md` – full assessment of the 59k LOC TAGS monolith with module map, strengths, and risk log.
- `TAGS-MVP-Module-Summary.md` – shortlist of the seven MVP-critical modules and rationale for deferring the rest.
- `TAGS-MVP-Module-*` docs – deep dives on pinch fixes, roadmap, and standardized architecture diagrams.
- `strangler-fig-*-plan.md` set – week-by-week strangler migration schedule for video-input wrappers with CQRS commands.
- Pipeline standardization scripts (`immediate-pipeline-standardization.js`, `standardized-pipeline-wrapper-template.js`) – ready-to-port scaffolds for Hex pipeline adapters.

## Extraction Takeaways
1. **Module Priorities** – MVP keeps 7/21 modules; Hand ID Manager is mandatory to prevent pinch contamination; gesture scope narrowed to pinch-only for MVP stability.
2. **Pipeline Wrappers** – CQRS wrappers already specced for video, landmark, gesture, output, viz; each wrapper needs API gateway + benchmarking hooks.
3. **Strangler Cadence** – Gradual routing percentages (10% ? 25% ? 50% ? 75% ? 100%) allow coexistence of legacy monolith and new wrapper for 5 weeks.
4. **Performance Targets** – Maintain 60 FPS, sub-20 ms latency, and event bus integrity (`MusicalGestureMediator`).
5. **Risk Register** – Notes repeated Git corruption, asset duplication, and documentation drift; reiterates ADR-before-restart rule.

## Action Hooks
- Feed module priority list into `blackboards/expression_systems.md` and pinch stability board.
- Create ADR: `ADR-2025-09-ArchiveModularization` capturing strangler plan and wrapper obligations.
- Template wrappers (`standardized-pipeline-wrapper-template.js`) should become reference for Hex adapter interfaces.

## Next Steps
- Link each referenced doc into the import manifest and blackboards.
- When implementing Hex pinch modules, reuse Hand ID Manager specs and pinch-only MVP guardrails.
- Schedule follow-up mining on `archive-august-3-2025-physics-cleanup/` for Boy-Scout cleanup scripts.
