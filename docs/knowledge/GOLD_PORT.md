# KnowledgePort — Gold Catalog (v0)

Contract

- Input: `docs/knowledge/` markdown files; optional `docs/doc_inventory.json`.
- Output: `docs/knowledge/GOLD_INDEX.md` (ordered, linkable catalog) and per-file skim sections (title, created_at, TL;DR if present).
- Success: Deterministic list regenerates locally/CI; no edits to sources; zero extra deps.
- Error modes: Missing inventory → fallback to folder scan; malformed front‑matter → skip TL;DR.

Run

- Node 18+ recommended.
- Generate: `node scripts/gold_index.mjs`

Next slices

- v0.1: add “scribe notes” section per item.
- v0.2: read `classification: Gold` from `docs/doc_inventory.json` when present.
- v0.3: emit `docs/knowledge/GOLD_SUMMARY.md` with extracted TL;DR snippets.

Notes

- Adapter strategy: keep sources; write derived artifacts.
- Ports/Adapters naming: KnowledgePort ⇄ GoldCatalogAdapter.
