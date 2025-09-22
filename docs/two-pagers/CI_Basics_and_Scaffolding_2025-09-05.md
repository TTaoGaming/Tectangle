# Continuous Integration (CI) Basics & Scaffolding (Two‑Pager)

Goal: Give you just enough practical CI understanding to keep regressions out and avoid restart syndrome. This is opinionated, minimal, and tuned to this repo (deterministic landmark goldens + future pinch events).

---

## 1. What CI Is (Plain Language)

CI = "A robot that reruns your build & tests every time code changes, so bad changes are caught early and automatically." It replaces:

- Forgetful humans (“I’ll run tests later”) → Automated.
- Works-on-my-machine drift → Standard clean VM each run.
- Hidden regressions → Fails fast when outputs differ.

Your mental model: Push branch -> Robot reconstructs environment -> Runs same commands you would locally -> Reports PASS / FAIL + artifacts (goldens, logs).

---

## 2. Core Terms (No Jargon Fog)

| Term | Plain Meaning | Why You Care |
|------|---------------|--------------|
| Workflow | YAML file telling GitHub Actions what to do | Your automation recipe |
| Job | A VM run (Ubuntu here) | Fresh, isolated environment |
| Step | Single command/action inside a job | Clear, linear trace |
| Action | Reusable step plugin (e.g. checkout) | Avoid writing plumbing |
| Runner | The machine executing the job | Ephemeral; nothing persists unless artifacted |
| Artifact | Files you upload from a run | Inspect goldens / logs offline |
| Concurrency | Auto-cancel older runs on same ref | Saves minutes; reduces stale noise |
| Cache (npm) | Speeds dependency install | Faster feedback loop |
| Matrix | Run same job across variations | (We skip until determinism across Node needed) |
| Secret | Encrypted value for auth | Not needed yet (no external pushes) |

---

## 3. Minimal Golden Regression Strategy

1. Deterministic extraction script (already built).
2. Freeze known-good outputs → snapshot (+ manifest).
3. CI regenerates outputs → compares to frozen manifest.
4. If mismatch and not intentional: FAIL (investigate root cause).
5. If intentional change: update + freeze (explicit human action) → commit new snapshot.

This creates a narrow gate: behavior changes can’t slip in silently.

---

## 4. Your Chosen Simplicity Rules

Keep only ONE canonical workflow: `pinchfsm-goldens-ci.yml` at repo root. Avoid nested duplicate workflows (deleted). No premature matrices, no dynamic scripts inside YAML—just explicit linear steps. Every step answers: “Why does this exist?”

---

## 5. Reference Workflow (Explained)

Logical sequence (already implemented):

1. Checkout (grab code).
2. Setup Node (pins toolchain; caches npm).
3. Install deps (`npm ci` deterministic install).
4. Verify prerequisites (`npm run verify`).
5. Generate goldens (fresh extraction).
6. Run tests (unit / assertions).
7. Verify against frozen manifest (if present) – regression gate.
8. Summarize directory (debug visibility).
9. Upload artifacts (goldens + manifest + logs).

Each step idempotent & observable.

---

## 6. When CI Fails (Decision Tree)

| Failure Type | Typical Cause | Action |
|--------------|---------------|--------|
| Install error | Dependency version drift | Re-run locally; pin/update package.json if needed |
| Verify script fails | Precondition (lint/schema) broke | Fix locally before push |
| Tests fail | Logic or threshold regression | Reproduce locally; write/adjust test |
| Goldens verify fails | Output drift | Investigate cause (config? dependency? logic?) – DO NOT auto-freeze |
| Timeout | Infinite loop / hang / network wait | Run locally with verbose logs; add timeouts |

If root cause = intentional behavior change → regenerate + `goldens:curate-freeze` → commit.

---

## 7. Golden Drift Investigation Checklist

1. Reproduce locally: `npm run human:extract` then diff JSONL / manifest.
2. Compare dependency versions: `npm ls <pkg>`; check lockfile changes.
3. Inspect model load paths – were model files updated?
4. Sample a frame diff (numeric delta) – are values systematically shifted (scale/normalization) or random (timing / nondeterminism)?
5. Confirm env (Node version, OS) matches CI (Node 22, Ubuntu) if using a different local setup.
6. Only after cause known: decide freeze or fix.

---

## 8. Adding New Behavior (Future Pinch Events)
Extend pipeline minimally:

- Add event synthesis step after landmarks extraction (generates event JSONL).
- Include event files in freeze + manifest hash set.
- Add tests asserting event transitions (FSM states sequence) for sample clips.
- Keep same review gate (manifest verify) before merge.

Avoid: Multiple overlapping workflows for landmarks vs events—fold into same job unless runtime becomes prohibitive (>10m). Split only when necessary.

---

## 9. Guardrails Against “Spaghetti”
 
| Anti-Pattern | Prevention Rule |
|--------------|-----------------|
| Ad-hoc bash one-liners in YAML | Move logic into versioned `scripts/*.mjs` |
| Hidden side-effects | Every script: clear input → output contract in header comment |
| Auto-freezing in CI | Require manual run locally + commit (keeps intent explicit) |
| Silent dependency bumps | Use `npm ci` + lockfile review PRs |
| Mixed responsibilities in one file | Separate extraction, verification, event generation scripts |

---

## 10. Small Upgrades (Optional Later)
 
Priority order (implement only when needed):

1. Badge: Add status badge to README.
2. Duration budget: Fail if job > X minutes (protect feedback speed).
3. Node version matrix (22 + LTS) to prove determinism holds.
4. Slack / Teams notification (only on main failures).
5. Upload diff report artifact (numeric deviation summary) for golden drift.

---

## 11. Quick Glossary Reinforcement
 
Push: Send commits to remote branch.
Pull Request (PR): Ask to merge your branch into main (CI + review gate).
Freeze: Commit snapshot of expected outputs (manifest + JSONL).
Drift: Unintended difference vs frozen reference.
Artifact: Files you can download from a run (evidence / debugging).
Concurrency Cancel: Auto-kill an older run when a newer push arrives.

---

## 12. Your Minimum Daily Habit
 
```bash
# sync & branch
git switch main && git pull --ff-only
git switch -c feature/<slug>
# code...
npm run verify && npm test
npm run human:extract   # if behavior touched
# view diffs, freeze if intentional
npm run goldens:curate-freeze
git add . && git commit -m "feat: <message>"
git push -u origin feature/<slug>
# open PR, ensure CI green
```

---

## 13. Success Criteria (Definition of Done for CI Stability)
 
- Single workflow governs core regression gate (DONE).
- Deterministic install + extraction (DONE).
- Frozen manifest diff blocks unintentional changes (ENFORCED).
- Human action required to update goldens (DONE).
- Clear two-pager (THIS DOCUMENT) available in `docs/two-pagers` (DONE).

If all green: proceed to PinchFSM event layer with confidence.

---

## 14. Next Step After Reading
 
Decide: Implement event synthesis scaffolding now or add numeric drift diff reporter. Recommend: build PinchFSM event generation (provides higher-level regression surface) next.

---
*End of Two‑Pager.*
