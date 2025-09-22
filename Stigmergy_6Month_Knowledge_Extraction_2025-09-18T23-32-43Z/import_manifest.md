<!--
STIGMERGY REVIEW HEADER
Status: First Pass Complete
Review started: 2025-09-17T08-40-39Z
Completed: 2025-09-18
Expires: 2025-09-24T08-40-39Z (auto-expire after 7 days)

Checklist:
- [ ] Classify additional legacy artifacts beyond initial sample
- [ ] Link each row to planned subsystem blackboard entry
- [ ] Update after each extraction loop
-->

# Legacy Knowledge Import Manifest - 2025-09-17T08-40-39Z

| Path | Last Modified (UTC) | Themes | Extraction Notes |
| --- | --- | --- | --- |
| .github/ | 2025-07-28T10:15:00Z | Copilot guardrails | Summary in knowledge_summaries/dot-github-summary.md; follow diagnostics-first/event bus rules when relocating. |
| .history/ | 2025-07-28T10:15:00Z | Archived snapshots | Summary in knowledge_summaries/history-summary.md; archival-only, no active mining. |
| .kilocode/ | 2025-07-30T23:59:00Z | MCP tooling config | Summary in knowledge_summaries/kilocode-summary.md; copy to keep filesystem/time/memory servers aligned. |
| .kiro/ | 2025-07-27T16:01:00Z | Strategy specs & steering | Summary in knowledge_summaries/kiro-summary.md; use option analyses for ADR prioritisation. |
| .vscode/ | 2025-07-23T01:22:00Z | Workspace settings | Summary in knowledge_summaries/vscode-summary.md; replicate Live Server port/spellings. |
| archive/ | 2025-07-30T06:51:00Z | TAGS modularization docs | Summary in knowledge_summaries/archive-root-summary.md; supplies module priorities + strangler plans. |
| archive-august-3-2025-physics-cleanup/ | 2025-08-03T19:53:00Z | Physics cleanup + offline loader | Summary in knowledge_summaries/archive-august-3-2025-physics-cleanup-summary.md; captures offline dependency loader, Jest test infra, pinch physics playground. |
| archive-working-TAGS-MVP-Modular-Monolith/ | 2025-07-30T19:19:00Z | Production monolith snapshot | Summary in knowledge_summaries/archive-working-tags-mvp-modular-monolith-summary.md; bridges, diagnostics, organisation plan. |
| August Tectangle Sprint/ | 2025-08-17T21:20:24Z | Gesture platform sprint | Summary in knowledge_summaries/august-tectangle-sprint-summary.md; adopt pinch/event schema in pinch & telemetry boards. |
| hand-physics-playground/ | 2025-08-05T01:12:00Z | Physics playground | Summary in knowledge_summaries/hand-physics-playground-summary.md; reuse managers + step1 demos. |
| handsfree/handsfree/ | 2025-06-10T07:54:10Z | Pinch instruments, orientation aware MPE | Hooked into pinch_stability / 	elemetry_sync / nchor_interaction; capture gesture instrument pinch model, camera-MPE telemetry, audit large interactive-projector bundle. |
| hope-ai/ | 2025-08-05T20:18:00Z | Collaboration system toolkit | Summary in knowledge_summaries/hope-ai-root-summary.md; expression board updated. |
| Knowledge backup 20250417/ | 2025-04-17T06:46:40Z | Legacy drumpad playbooks | Rich reference docs feeding expression_systems & pinch_stability heuristics. |
| mvp/ | 2025-08-03T19:48:00Z | MVP hand tracking demos | Summary in knowledge_summaries/mvp-root-summary.md; reuse dependency checker + physics plan. |
| offline-dependencies/ | 2025-08-03T19:48:00Z | Offline asset bundle | Summary in knowledge_summaries/offline-dependencies-summary.md; keep bundle paths intact. |
| Spatial Anchor MPE v25.7.10/ | 2025-08-05T08:15:40Z | Camera-MPE production, modular anchors | Cross-link to 	elemetry_sync / nchor_interaction; extract TAGS monolith patterns & orientation telemetry. |
| Stigmergy_6Month_Knowledge_Extraction_2025-09-17T08-32-43Z/ | 2025-09-18T02:42:00Z | Knowledge hub | Contains plan, manifest, blackboards, rollups, metrics, scripts; copy entire hub when relocating. |
| TAGS-AI-Optimized/ | 2025-08-01T21:59:00Z | AI-optimized rebuild | Summary in knowledge_summaries/tags-ai-optimized-summary.md; phased roadmap + Phase1 testing harness. |
| Tectangle Project folder/ | 2025-08-05T09:16:11Z | React/ECS experimentation | Linked to expression_systems; catalog git roots, flag VSCO sample pack, plan migration of React/ECS layers. |
| docs-archive-2025-08-02-01-04/ | 2025-08-01T20:05:00Z | Documentation snapshot | Ensure relevant docs are mirrored into hub summaries before relocation. |
| docs/aichat/AiChatArchitecture20250904.md | 2025-09-05T07:11:35Z | MPE, quantization, TOI look-ahead, drumpad UX | Capture FSM + quantization params into Pinch Stability board; note MPE channel mapping requirements for game bridge profiles. |
| docs/aichat/aiChatTectangleOnePage20250906.md | 2025-09-06T21:47:29Z | WebMIDI, Ableton Link, session sync | Feed tempo/phase alignment ideas into Telemetry & Network board; validate dependency assumptions. |
| docs/aichat/AIChatHiveFleetObsidian20250907.md | 2025-09-08T01:08:28Z | Blackboard, multi-agent orchestration | Seed global stigmergy/blackboard pattern; extract actionable governance rules for extraction process. |
| docs/aichat/AiChatTectanglePinch2MVP20250907.md | 2025-09-07T20:45:47Z | Physics gating, controller IDs, predictive TOI | Port lifecycle notes into Pinch + Seat Concurrency boards; reconcile with current HandSessionManager. |
| docs/two-pagers/PinchFSM_Deterministic_TwoPager_2025-09-05.md | 2025-09-05T07:11:35Z | Pinch FSM, quantization controls | Primary source for deterministic tests; map config table to new hex core interface. |
| docs/two-pagers/Rapier_TwoPager_2025-09-05.md | 2025-09-05T07:12:17Z | Rapier physics, CCD, ECS hooks | Identify reusable physics adapters; plan ECS integration backlog. |
| docs/two-pagers/ThreeJS_TwoPager_2025-09-05.md | 2025-09-05T07:12:17Z | Visualization, debug tooling | Add to Visualization board; convert best practices into integration tests for overlay renderer. |
| docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md | 2025-09-05T07:12:17Z | Capture pipeline, quantization off-path | Align with run_video_collect_golden.js refactor and telemetry guardrails. |
| docs/knowledge/Consolidated_Pinch_Report_2025-09-06_FINAL.md | 2025-09-07T09:09:12Z | Metrics, failure taxonomy | Use as baseline KPI reference in Pinch Stability board. |
| docs/knowledge/mcp_memory.md | 2025-09-07T09:18:38Z | Knowledge retention, SRL notes | Cross-link to extraction SRL loop; ensure updates per session. |
| docs/knowledge/migration_proposal.md | 2025-09-06T22:45:13Z | Architecture transition plan | Validate against current hex modules; note gaps for Feature Flags board. |
| docs/knowledge/code_scan_summary_20250907.md | 2025-09-07T01:42:49Z | Code inventory, hot spots | Prioritize modules with high churn for early extraction. |
| docs/knowledge/monolith_scribe.md | 2025-09-11T20:23:39Z | Legacy aggregation, drumpad experiments | Mine for drumpad/MPE specifics; create Expression Systems board entry. |
| docs/deepdives/DeepDive_CameraManager_20250907.md | 2025-09-07T10:16:23Z | Camera pipeline, ECS touchpoints | Feed into Sensor/Camera board; align with seat concurrency telemetry. |
| docs/doc_inventory.md | 2025-09-06T21:33:43Z | Bulk index | Use for completeness check; automate diff after each ingestion pass. |
| docs/doc_inventory.json | 2025-09-06T21:58:08Z | Bulk index (JSON) | Parse for automation; see metrics/doc_inventory_summary.md for aggregated view. |
| metrics/doc_inventory_summary.md | 2025-09-17T08:40:39Z | Metrics snapshot | Summary of doc inventory counts; update after rescans. |

> Update this manifest after each extraction session. Link rows to the subsystem blackboard once created.

