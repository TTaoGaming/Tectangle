---
id: ww-2025-086
owner: @webcartographer
status: active
expires_on: 2025-10-12
guard: ci:smoke-arcade-hub (gates unlock on timer; links/iframes reachable; a11y title present)
flag: FEATURE_ARCADE_HUB, FEATURE_TOOL_ATLAS
revert: remove hub page + flags + index entries
---
# Webway: Gameful tool virtualization (time‑gated Atlas)

## Goal

Use the “sticky” feedback loops of simple games (clear goals, short cycles, visible progress) to host and launch a growing set of everyday tools in a web “Arcade Hub.” Apply time‑gated mechanics to pace onboarding, show progress, and build durable habits from cradle to grave. Keep the system adopt‑first, flag‑guarded, and reversible.

## Constraints

- License: in‑repo assets + open web (no closed SDKs) (source: defaults)
- Dependencies: 0–1 small libs per tool; hub stays static HTML (source: defaults)
- Perf: instant load on desktop; ≤ 200ms input→feedback (source: defaults)
- Privacy/Security: local‑only defaults; iframes same‑origin or postMessage (source: message)
- CI: smoke must verify gating works and iframes respond (source: message)

## Current Map

- Demos exist (Dino + gesture pages); iframe bridge pattern is proven. (source: repo)
- Feature flags and SRL/ADR processes in place. (source: repo)
- Static server tasks exist for quick local runs. (source: tasks)

## Timebox

Planning/logs 20m; baseline hub 40m; guarded smoke 40–60m. (source: defaults)

## Research Notes

- Game loops (goal → action → feedback → progression) transfer well to habit tools when cycles are small and successes are visible. (source: message)
- Time gates (daily timers, streaks, cooldowns) focus attention and create “return hooks.” (source: message)
- A Tool Atlas with iframe launchers can host diverse utilities and capture intent data locally for personalization. (source: message)

## Tool Inventory

- Local servers (8091), jest+puppeteer harness, existing demos (gesture→Dino). (source: tasks)
- Flags: FEATURE_ARCADE_HUB, FEATURE_TOOL_ATLAS (new). (source: defaults)
- Silk Scribe + Webway governance. (source: repo)

## Options (Adopt‑first)

1. Baseline static hub — Grid of launch cards with simple countdown gates; launches iframes to existing demos/tools.
   - Trade‑offs: fastest path; minimal data; easy to iterate.
2. Guarded hub — Add CI smoke to assert gate unlock after T seconds and iframe responds to a ping. Include basic a11y checks (titles/labels).
   - Trade‑offs: adds harness work; reliable deployability.
3. Progressive profiles — Persist per‑user streaks/goals locally; surface recommended tools; integrate seating and gesture adapters where applicable.
   - Trade‑offs: larger slice; storage/features to design; big UX upside.

## Recommendation

Option 2: Ship a minimal hub with time gates and a smoke guard. Iterate toward progressive profiles once usage signals are healthy.

## First Slice

- Add `dev/arcade_hub.html` with 2–3 cards (e.g., Gesture→Dino, Open→Fist→Dino), each behind a short countdown. When a card unlocks, enable a “Play” button to mount or open the iframe.
- Insert `WEBWAY:ww-2025-086` markers. Keep everything static and reversible.

## Guard & Flag

- Guard: `ci:smoke-arcade-hub`—open the hub, wait for a gate (short T) to unlock, click Play, assert iframe `contentWindow` receives a simple `postMessage` ping and replies (or a visible indicator appears).
- Flags: `FEATURE_ARCADE_HUB`, `FEATURE_TOOL_ATLAS` to scope hub visibility and future integrations.

## Industry Alignment

- Gamified learning/productivity workflows (streaks, quests) increase adherence when respectful and transparent. (source: message)
- Web iframes + postMessage provide a safe adapter boundary for heterogeneous tools. (source: message)

## Revert

- Remove the hub file and flag mentions; keep demos/tools accessible directly.

## Follow‑up

- Add a tiny persistence for last‑used tools and streak; optional calendar‑based gates.
- Layer minimal a11y and keyboard support; ensure screen reader labels.
- Explore “quests” that chain tools (e.g., capture → transform → share) with visible progress.
