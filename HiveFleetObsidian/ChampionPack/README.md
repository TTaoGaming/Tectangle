# ChampionPack (v1-lite)

## Purpose


- A tiny, freeze-able kit to render your champions (seeds) into multiple runtimes deterministically.
- Keep kernel fields minimal; add adapters later without changing seeds.

## Contents


- schema/seeds.kernel.v1.json - minimal schema matching current seeds (version, metadata, identity, lineage_tags, mission, triggers, inputs_required, output_shape, guardrails, procedure, stop_rules, defaults, invocation.one_line, notes_patched_weaknesses).
- adapters/to_system_prompt.mjs - pure function that turns a seed object into a deterministic "custom instructions" string.
- adapters/to_crewai.mjs - pure function that turns a seed object into a CrewAI-like role config.

## Determinism


- Same seed in → same text out. No dates, randomness, or environment-derived text.
- Keep key order stable; prefer simple templates.

## How to use (developer notes)


1) Parse YAML seed (e.g., js-yaml) into an object.
2) Call an adapter: toSystemPrompt(seed) or toCrewAI(seed).
3) Snapshot the output to lock behavior.

## Roadmap (optional next)


- Add a tiny CLI (seedctl) to validate and render.
- Add snapshot tests for each seed (Thread Sovereign, Faultline Seeker, Prism Magus, Silk Scribe, Web Cartographer).
- Introduce typed IO as v1.1 without breaking v1-lite.

ChampionPack (v1-lite)

Purpose
- A tiny, freeze-able kit to render your champions (seeds) into multiple runtimes deterministically.
- Keep kernel fields minimal; add adapters later without changing seeds.

Contents
- schema/seeds.kernel.v1.json - minimal schema matching current seeds (version, metadata, identity, lineage_tags, mission, triggers, inputs_required, output_shape, guardrails, procedure, stop_rules, defaults, invocation.one_line, notes_patched_weaknesses).
- adapters/to_system_prompt.mjs - pure function that turns a seed object into a deterministic "custom instructions" string.
- adapters/to_crewai.mjs - pure function that turns a seed object into a CrewAI-like role config.

Determinism
- Same seed in → same text out. No dates, randomness, or environment-derived text.
- Keep key order stable; prefer simple templates.

How to use (developer notes)
1) Parse YAML seed (e.g., js-yaml) into an object.
2) Call an adapter: toSystemPrompt(seed) or toCrewAI(seed).
3) Snapshot the output to lock behavior.

Roadmap (optional next)
- Add a tiny CLI (seedctl) to validate and render.
- Add snapshot tests for each seed (Thread Sovereign, Faultline Seeker, Prism Magus, Silk Scribe, Web Cartographer).
- Introduce typed IO as v1.1 without breaking v1-lite.
