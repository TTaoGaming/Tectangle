<!-- Updated: 2025-09-18T13:32:25.881Z -->
# Web Cartographer - Pattern Notebook

Purpose: battle‑tested mapping patterns that reduce drift and help picks seams.

Core Patterns
- Entrypoint scan: HTML <title>/H1; MD H1; include README/index as seeds.
- Link extraction: capture href/src; strip queries/anchors; normalize paths.
- Graph analysis: count in‑degree (orphans), unresolved targets (dangling), and top hubs.
- Freshness window: scan recent files (since‑days) to keep runs cheap.
- Guardrail flag: fail on dangling only when `HFO_CARTO_FAIL_ON_MISSING=1`.
- Ignore lists: node_modules, .git, archives; keep the map signal clean.

Hex Seams
- Ports/Adapters: propose a "port seam" when a high‑hub node intersects the target domain.
- Smallest path: prefer a minimal adapter that connects the seam to a working demo.

Proven Moves
- Wardley framing: identify user needs → components → map inertia/hubs.
- ADR pointer: when a seam is chosen, add a brief ADR with rationale and rollback.
- CI watchdog: run cartography nightly; alert on new orphans/dangling spikes.

Guardrails
- Don't block on low‑risk dangling links by default; log them.
- Treat orphans as a nudge to add a link or remove dead files.

