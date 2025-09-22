# HFO on Dify - Minimal, Reversible Workflow

Map (ports → adapters)

- Orchestrator (council): tools/moe_chat.mjs, tools/orchestrator_turn.mjs → Dify Workflow (parallel roles)
- Scribe/history: tools/append_history.mjs, tools/silk_scribe_intake.mjs → HTTP adapter (webhook)
- Heartbeat/report: tools/heartbeat.mjs → optional webhook from Dify run summary

Goal
Run multiple role "modes" in parallel, merge, return structured JSON, and append history via webhook.

Workflow (Dify)

1) Inputs: { task, context?, tag?, modeSet? }
2) Parallel LLM nodes (roles): Planner, Builder, Critic (or your champions). System prompts define role.
3) Merge (Code node): combine role outputs → JSON result.
4) HTTP Request node (optional): POST result to /scribe/append adapter.
5) Output: JSON result back to caller.

Contracts

- Input JSON
  {
    "task": "string",
    "context": "string?",
    "tag": "string?",
    "modeSet": "string?"  
  }

- Output JSON
  {
    "summary": "string",
    "modes": { "planner": "string", "builder": "string", "critic": "string" },
    "actions": [ { "id": "string", "cmd": "string", "args": ["string"], "reason": "string", "confirm": true } ],
    "metrics": { "tokens": 0 }
  }

Scribe Webhook (adapter seam)

- POST /scribe/append { snapshot: "dify:hfo", metric: "...", lesson: "...", type: "turn" }
- Implementation: wrap tools/append_history.mjs behind a tiny HTTP server.

Supervised PC Control (safe pattern)

- Dify emits actions[] proposals.
- Local executor (HTTP server) requires approval and whitelists commands; on approve runs steps and returns per-action status.
- Default is dry-run; execution enabled only when ALLOW_EXEC=1 and approval=="YES".

Reversible First Slice

- Build Dify Workflow with 3 role nodes + merge; no executor yet.
- Add scribe webhook.
- Feature flag HFO_DIFY=1 to route calls to Dify endpoint; unset to rollback.

Notes

- Secrets: store model keys in Dify vault.
- Observability: use Dify run logs for prompts and outputs.
