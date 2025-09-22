# Contributing (PinchFSM Subproject)

Goal: Keep history clean, freeze deterministic goldens intentionally, catch regressions early.

## Branch Model (Baseline)

| Action | Rule |
| ------ | ---- |
| New work | `git switch main && git pull --ff-only && git switch -c feature/<slug>` |
| Sync with main | Rebase before first push; after review started use merge if needed |
| Commit style | Small, purposeful, present tense (`feat: add pinch runner skeleton`) |
| Golden changes | Only when behavior intentionally modified or new scenario added |
| Freezing | `npm run human:extract && npm test` then `npm run goldens:curate-freeze` |
| Do not | Force-push `main`, edit frozen snapshots, auto-freeze in refactor PRs |

## Required Local Checklist (Before Push)

1. `git status` is clean (only intended files staged).
2. `npm run verify` passes.
3. `npm run human:extract` (if landmark-affecting change) then `npm test`.
4. If outputs changed intentionally: `npm run goldens:curate-freeze` and commit new frozen dir + pointer.
5. Rebase onto latest `origin/main` (first push) OR merge main in (active reviewed branch).

## Pull Request Checklist

Include in description (PR template enforces):

- [ ] Purpose (one sentence)
- [ ] Change type: Feature / Fix / Refactor / Docs / Golden Update
- [ ] Goldens impacted? If yes, rationale + diff summary
- [ ] `npm test` local result: PASS
- [ ] Frozen verification (if applicable) PASS
- [ ] No unrelated reformat noise

## Golden Update Policy

If goldens drift unintentionally: investigate first. Do NOT freeze as a fix. Root causes: dependency upgrade, model file change, extraction logic change. Document cause in PR.

## Commit Message Hints

Format: `<type>(optional-scope): <imperative>`
Types: feat, fix, chore, docs, refactor, test.

## Safety / Recovery

- Lost commit? `git reflog`.
- Undo last commit keep work: `git reset --soft HEAD~1`.
- Safe undo shared: `git revert <sha>`.
- Shelve WIP: `git stash push -m "msg"`.

## Minimal Daily Flow

```bash
git switch main
git pull --ff-only
git switch -c feature/pinch-runner
# work / commits
git fetch origin
git rebase origin/main   # if unpublished
git push -u origin feature/pinch-runner
```

## Automation Notes

- CI regenerates landmarks and verifies vs frozen manifest.
- Concurrency cancellation prevents stale runs; rerun CI after freeze.

## When in Doubt

Open a small PR early rather than a giant branch. Smaller review surface = fewer regressions.
