# ADR | 2025-09-20T05:20:00Z | ww-2025-086

Context: We want to harness the engaging loops of games to onboard and retain users across a growing toolset, pacing progression with simple time gates.
Decision: Create a static Arcade Hub with time‑gated launchers that iframe existing tools/demos; add a CI smoke for gate unlock and iframe health; guard via flags.
Consequences: Fast to ship; low risk; measurable; easy to evolve into streaks/quests later. Fully reversible by removing the hub and flags.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-086_gameful_tool_virtualization.md)
