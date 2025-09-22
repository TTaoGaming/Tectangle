<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Log decisions in TODO_2025-09-16.md
-->

Tommy’s One‑Page Test & CI Guide (Hexagonal Pinch)

Why this exists
- Reduce cognitive load and stop regressions. Use deterministic golden replays by default; escalate to video only when needed. Keep agents aligned with your Consolidation Plan and today’s TODOs.

Test Strategy (three tiers)
- Tier 1 — Deterministic core replay (gate every PR)
  - Input: landmarks JSONL (t + 6 points: indexTip, thumbTip, wrist, indexMCP, pinkyMCP, hand)
  - Runs: Node only, no browser/MediaPipe
  - Command: `node tests/replay/replay_core_from_trace.mjs tests/landmarks/right_hand_normal.jsonl`
  - Gate: downs/ups count, order, specCancel%, mean latency band (envelopes via env)
- Tier 2 — Deterministic page replay (gate wiring)
  - Uses dev page + `window.__hex.replayLandmarks(frames)`; no video/MediaPipe
  - Command: `DEMO_URL=http://localhost:8080/September2025/TectangleHexagonal/dev/index.html node tests/replay/replay_page_from_trace.cjs tests/landmarks/right_hand_normal.jsonl`
  - Produces page goldens in `tests/out/`
- Tier 3 — E2E video smoke (non‑blocking/nightly)
  - Full stack: MP4 + MediaPipe; fragile under headless
  - Command: `node tests/smoke/run_video_collect_golden.cjs ".../videos/samples/right_hand_normal.mp4"`
  - Treat failures as flaky; use retries and timeouts; do not block PRs.

What to pay attention to
- Goldens are contracts: If behavior changes intentionally, update the goldens and envelopes in the same PR with notes.
- Landmarks traces are the source of truth: Record once (from webcam or video), then replay deterministically in CI.
- Envelopes: Keep them tight enough to catch regressions, loose enough to avoid false alarms (tune per clip).
- Escalation: Core replay → Page replay → Video smoke. Don’t jump to video unless you changed adapters/MediaPipe.

How to instruct AI assistants
- Point to `September2025/TectangleHexagonal/agent.md` and this file.
- Non‑destructive changes only: don’t remove hooks: `__hex.{replayLandmarks,startVideoUrl}`, `__getGolden`, `__getTelemetry`.
- If changing thresholds or core logic: update/readme, re‑record or re‑derive goldens, and adjust envelopes.
- Respect the hexagonal boundaries: keep domain core pure (no DOM); adapters only bridge ports.

Today’s focus (anchor to your plan)
- Follow: `archive-stale/hope-ai/CONSOLIDATION-PLAN-2025-08-05-1445.md`
- Today’s TODO: `September2025/TectangleHexagonal/TODO_2025-09-07.md`
- Working folder: `September2025/TectangleHexagonal/work_2025-09-07/`

Breadcrumbs (non‑destructive TODOs)
- Keep new TODOs timestamped as `TODO_YYYY-MM-DD.md` and never overwrite.
- Known TODOs index: `September2025/TectangleHexagonal/TODO_2025-09-07.md` (today) and many historical TODOs (see TODO_INDEX below).

Next steps checklist
- Add landmarks recorder in dev page (button: Start/Stop/Download landmarks JSONL). [Done]
- Seed two landmark traces from your MP4s (normal, gated) and store under `tests/landmarks/`.
  - Option A (deterministic): Python extractor — `scripts/python/extract_landmarks.py` (see scripts/python/README.md)
  - Option B (UI): Use Start/Load/Download in the dev page
- Add CI workflow: run Tier 1 + Tier 2 on PRs; Tier 3 nightly/non‑blocking.
