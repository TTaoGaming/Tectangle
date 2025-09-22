<!--
STIGMERGY SUMMARY HEADER
Source: hope-ai/
Generated: 2025-09-18T02:00Z
-->

# Hope AI Root Summary (Collaboration Toolkit)

## Core Package
- `hope-ai-core.md` defines personality controls (teachingMode 0.8, collaborationDepth 0.9, toolOrchestration 0.9) plus Tommy-specific profile and activation protocol.
- `hope-ai-streamlined.js` exposes `respond`, `storeMemory`, `searchMemory`, `registerTool`, and integrates Conversation Tool, Memory Bank, and Polya Tool.
- `CLEANUP_GUIDE.md` and `activation-test.js` document reset steps and smoke tests for the streamlined build.

## Memory Bank Insights
- `project-status.md` captures the digital piano vision (global access, $50 smartphones, 480p/30fps constraint, offline-first) and enumerates open milestones.
- `ai-audit-research-summary.md` logs the “31 restarts” antipattern analysis and the five-stage pipeline strategy for multi-agent collaboration.
- `tags-*` memory files (added Sept 18) summarize TAGS architecture evolution, navigation heuristics, and technical insights; these should feed directly into TAGS ADRO/blackboard work.

## Tooling Highlights
- `tools/ConversationTool.js` tracks session state (decisions, TODOs, teaching moments) and exposes `startSession`, `recordDecision`, `summarize` helpers.
- `tools/MemoryBank.js` supports tag-based CRUD with confidence weighting and scoped retrieval.
- `tools/PolyaTool.js` implements the 4-step Polya framework with embedded prompt templates for each phase.
- Tool orchestrator (`tools/index.js`) auto-registers these modules and provides `executeTool(name, context)` entry points.

## Action Hooks
1. Add Hope AI personality + activation snippets to `blackboards/expression_systems.md` under collaboration agents.
2. Record ADR `ADR-2025-09-HopeAIToolkit` covering behavioural settings, memory taxonomy, and integration obligations for Hex agents.
3. Mirror Memory Bank constraints into SRL workflow (tagging decisions, enforcing update protocol).

## Follow-On Tasks
- Sync memory-bank `tags-*` files with `root-knowledge-overview.md` references.
- Verify tool APIs against current multi-agent orchestration scripts before redeploying in active dev environment.
