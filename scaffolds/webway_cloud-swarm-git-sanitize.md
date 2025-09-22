---
id: ww-2025-121
owner: @TTaoGaming
status: active
expires_on: 2025-10-05
guard: sanitize:ci && hex:overlay:verify
flag: FEATURE_PUBLISH_SANITIZED_MIRROR
revert: remove mirror remote + disable FEATURE_PUBLISH_SANITIZED_MIRROR
---
# Webway: Cloud Swarm + GitHub with Sanitized Mirror

 
## Goal
Move Tectangle Hexagonal + HiveFleet Obsidian online to collaborate from anywhere, enable cloud agent swarms with chat (Discord/Slack) and voice, and keep personal data private via automated sanitization.

 
## Constraints
- License: preserve current licenses; avoid shipping third-party assets without permission (source: defaults)
- Dependency budget: 1 small lib per need; prefer native GitHub Actions + Node (source: defaults)
- Perf: CI under 15 min; chat bot latency < 2s p50 (source: defaults)
- Privacy/Security: no PII in public; secrets in vault/Actions secrets; no telemetry by default (source: defaults)
- Time: timebox 20 min for first slice; reversible (source: defaults)
- CI: must pass existing Hex guards (overlay verify, visual checks) (source: message)

 
## Current Map
- Local repo on Windows with GSOS, Webways, Silk Scribe logs, and personal notes mixed in (source: message)
- CI/test tasks exist (hex:*), http-server scripts, Jest e2e (source: codebase)
- Blackboard and many Webway notes already structured (source: codebase)

 
## Timebox
20 minutes for first slice (private repo + sanitization dry-run) (source: defaults)

 
## Research Notes
- Silk Scribe structure present: logs/srl, logs/adr, indexes ready (source: file)
- Sensitive files likely include personal notes under TommyNotes*, Knowledge backup, history thread, import-ready JSONL (source: message)
- Git hosting options: GitHub private with optional public mirror; GitLab/Gitea self-hosted (source: defaults)
- Chat integrations: Slack and Discord bot platforms with OAuth + slash commands; GH Actions can trigger bots via webhooks (source: defaults)

 
## Tool Inventory
- Tasks: hex:* (overlay verify, visual diff, tiers), http-server (source: codebase)
- Proposed scripts: scripts/sanitize.mjs (regex/allowlist scrub), scripts/mirror_publish.mjs (rsync/filter to mirror) (source: defaults)
- CI: GitHub Actions workflow sanitize.yml + mirror.yml (source: defaults)
- Secrets store: GitHub Actions Secrets (GITHUB_TOKEN, DISCORD_WEBHOOK_URL, SLACK_BOT_TOKEN) (source: defaults)
- Bots: Discord application + bot, Slack app with bot + slash commands (source: defaults)

 
## Options (Adopt-first)
1. Baseline — Private GitHub + Sanitized Public Mirror
   - What/How: Create a private GitHub repo; push full working tree. Add sanitize pipeline that builds a filtered artifact and publishes to a separate public mirror repo. Use Actions + filter lists (.sanitizeignore) to exclude PII paths/patterns. Enable GH secret scanning.
   - Who/When/Where/Why: You today; minimal friction; allows private work + public sharing of safe docs.
   - Trade-offs: Two repos to maintain; mirror is read-only view; requires discipline on filters.

2. Split Repos — Public Core + Private Knowledge
   - What/How: Extract engine/demo code to a public repo; keep Silk Scribe, notes, and datasets in a private repo. Use submodules or an export script to compose a workspace.
   - Trade-offs: Clear separation of concerns; more wiring; dev UX can be more complex locally.

3. Self-hosted SCM — Gitea/GitLab + Tailscale
   - What/How: Host a private Gitea/GitLab on a small VM; push everything privately; later export a sanitized GitHub public mirror. Add runners for agent swarms.
   - Trade-offs: More ops overhead; maximum privacy/control; good for long-term multi-swarm orchestration.

 
## Recommendation
Option 1 for speed-to-green and reversible adoption. Option 2 can follow to harden boundaries. Option 3 if you need strict data residency or multi-tenant control.

 
## First Slice
- Create a private GitHub repo and push the current project.
- Add scripts/sanitize.mjs with allowlist/denylist rules (emails, phone, tokens, TommyNotes*, Knowledge backup, archive-*, human-main-referenceonly/, mediapipe-master-referenceonly/, import-ready/ JSONL, historythread/). Add npm script sanitize:ci to run on PR.
- Configure Actions workflow to run sanitize:ci and block if issues found.
- Prepare a public mirror repo but keep publishing disabled until sanitize passes.

 
## Guard & Flag
- Guard: sanitize:ci (fails on PII patterns or disallowed paths) + hex:overlay:verify stays green.
- Flag: FEATURE_PUBLISH_SANITIZED_MIRROR toggles the mirror publishing job.

 
## Industry Alignment
- GitHub private first with secret scanning + CODEOWNERS (source: defaults)
- GDPR/PII redaction pipelines; least privilege for tokens (source: defaults)

 
## Revert
- Disable FEATURE_PUBLISH_SANITIZED_MIRROR; remove mirror remote; delete public repo; rotate tokens and invalidate webhooks.

 
## Follow-up
- Add Discord/Slack orchestrator bot that opens/labels issues and triggers CI runs; relay artifacts (reports/heartbeats).
- Add voice input (Discord voice or WebRTC) to the orchestrator facade.
- Evaluate self-hosted runners for agent swarms; pin Actions to specific versions; add smoke tests for the bot flows.
