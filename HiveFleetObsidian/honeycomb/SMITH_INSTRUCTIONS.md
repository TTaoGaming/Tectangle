<!-- Updated: 2025-09-18T13:32:25.843Z -->
# Honeycomb Smith - Standardization Routine

- Goal: Keep the hive tidy and fast; evolve safely over time.
- Success: duplicate_titles==0; all canons have success criteria; personas complete; smoke/frozen PASS.

Steps
- Normalize ASCII: node HiveFleetObsidian/tools/normalize_ascii.mjs --apply
- Re-index Honeycomb: npm run hive:smith (use :all to include archives)
- Validate champions: npm run hive:standardize (writes smith_report.md/json)
- Enforce names: npm run hive:archive_snake:apply
- Consolidate duplicates: npm run hive:consolidate (then :apply)

Flags & Notes
- Archives off by default; opt-in via --include-archive when needed.
- All changes reversible; prefer local archive/ over deletion.
- Keep roles project-agnostic; seats define actions.
