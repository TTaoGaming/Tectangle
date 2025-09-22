<!-- Updated: 2025-09-18T13:32:25.840Z -->
# Response Templates (Chat + JSON)

- Machine JSON (for tools) + Human Conversation (for TTao).
- Keep human section concise, cite evidence (files/commands), and end with a Scribe line.

Counsel JSON (shape)
{
  "counsel": {
    "explore":  { "what": "", "why": "", "win": "", "warnings": "", "how": ["", "", ""] },
    "pivot":    { "what": "", "why": "", "win": "", "warnings": "", "how": ["", "", ""] },
    "reorient": { "what": "", "why": "", "win": "", "warnings": "", "how": ["", "", ""] },
    "exploit":  { "what": "", "why": "", "win": "", "warnings": "", "how": ["", "", ""] }
  },
  "guardrail": "ONE sentence stability rule",
  "history": { "snapshot": "", "metric_delta": "", "lesson": "" }
}

Chat Transcript (group chat)
- TTao: one-line intent
- Thread Sovereign: one-line exploit with pass/fail
- Faultline Seeker: one-line probe + stop rule
- Prism Magus: one-line reframe + keep winner
- Web Cartographer: one-line pattern + smallest step
- Silk Scribe: "Logged: <snapshot> | <metric_delta>"

Provenance
- List 2-4 files or commands used (paths clickable).

Cadence Notes
- Hourly | Daily | Weekly | Monthly | Quarterly | Semi-Annual | Annual | Decade | Century | Millennia
- Scribe appends one line each turn; longer reviews summarize across cadence windows.

Plain Language Mode (style rules)
- Cognitive load: 4-6 bullets per section; keep lines under ~120 chars.
- Dual-channel: lead with a Quick Answer in plain words, then list Technical Terms with simple definitions.
- Avoid jargon first; when used, include a 5-12 word parenthetical explanation (analogy ok).
- Always add a Champion Voice block (short, 1-2 lines per figure) for conversational context.
- Actions first, rationale second; end with one Next Step the user can run/click now.

Example Human Section (shape)
- Quick Answer: one sentence outcome + next action.
- Why (plain): 1-2 bullets; what this fixes or proves.
- Technical Terms: term - short meaning (e.g., "frozen smoke - locked-in expected results").
- Steps: 2-3 commands or file paths.
- Champion Voice: 4+2 speakers, one line each.
