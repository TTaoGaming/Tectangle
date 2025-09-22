# Orchestration Port (HFO)

## Contract

- Inputs: modes (graphs), agents (roles), tools (adapters), IO channels, environment descriptors
- Outputs: neutral `orchestration.json` consumable by LangGraph, CrewAI, or custom runners
- Success: schema-valid manifest; adapters can map 1:1 without repo changes

## Data model (neutral)

- Mode: `{ id, description, entry, nodes[], edges[] }`
- Node: `{ id, kind: 'source'|'transform'|'sink'|'agent'|'tool', config }`
- Edge: `{ from, to, when? }`
- Agent: `{ id, description, model?, prompts?, toolsAllowed[] }`
- Tool: `{ id, kind: 'process'|'http'|'node'|'python', entry, args?, timeoutMs? }`
- IO: `{ topics: [ 'event.name', ... ] }`
- Env: `{ requires: [ 'LLM_API_KEY', 'TELEMETRY_ENDPOINT' ] }` (names only; no secrets)

## Adapters (mapping hints)

- LangGraph: nodes→graph nodes; edges→transitions; tools→tool functions; agent→LLM node
- CrewAI: agents→crew members; nodes (agent/tool)→tasks; tools→crew tools

## CLI

- Seed: `node HiveFleetObsidian/tools/orchestration_seed.mjs`

## Notes

- Keep secrets external (dotenv/CI). Port stays framework-neutral; adapters live beside orchestrators.
- Training flows: see Training/Virtualization Port; orchestrate `scenarios` from `manifests/training.json`.
