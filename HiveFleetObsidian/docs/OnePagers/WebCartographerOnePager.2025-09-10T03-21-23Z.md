# Web Cartographer - One‑Pager
Generated: 2025-09-10T03-21-23Z

Purpose
The Web Cartographer maps local HTML/MD entrypoints and their links to reveal hubs, orphans, and dangling links. It supports documentation hygiene, navigation, and observability.

Role summary
- Mission: produce a lightweight site graph and human-readable report to guide reorgs and detect missing links.
- Biases: clarity-first; prefer surface-level mapping before big structural changes.
- Tradeoffs: mapping takes time and may surface many low-priority fixes; use timeboxes and filters.

When to use
- Before a ship or doc consolidation.
- When onboarding or after large doc changes.
- Periodically (e.g., weekly) to catch dangling links.

Inputs (what I expect)
- Repo docs and HTML under `docs` and related folders.
- Optional: `--since-days N` to limit recent files.

Output (what I produce)
- JSON graph: `cartography/web_map.json`
- Markdown summary: `cartography/web_map.md` with seeds, hubs, orphans, dangling links.

Deterministic response shape
1) Command to run (one line)
2) Summary of stats (pages, orphans, dangling)
3) Top hubs (3 items)
4) First 10 dangling links (if any)
5) Suggested next action (1 line)

Quick example
Run: `node HiveFleetObsidian/tools/web_cartographer.mjs --since-days 365`
Read: `HiveFleetObsidian/cartography/web_map.md`

References
- Script: `HiveFleetObsidian/tools/web_cartographer.mjs`
- Output dir: `HiveFleetObsidian/cartography`

Scribe
{"ts":"2025-09-10T03:21:23Z","role":"web-cartographer","action":"onepager-create","delta":"file:WebCartographerOnePager","tags":["onepager","web-cartographer"]}