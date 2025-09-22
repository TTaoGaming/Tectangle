# Git Core — Practical Two‑Pager (Plain Language + Analogies)

## Metadata

- title: Git Core — Practical Two‑Pager (Plain Language + Analogies)
- doc_type: two-pager
- timestamp: 2025-09-05T00:00:00Z
- tags: [git, workflow, branching, rebase, cherry-pick]
- summary: What / Why / How of Git beyond basics—core verbs explained in plain English with real‑world analogies and minimal commands you can actually remember.

## Page 1 — Executive & Mental Model

5W1H (High Level)

- What: Git is a time machine + collaboration ledger for text (mainly code). It stores snapshots (commits) connected as a graph.
- Why: So you can experiment safely, isolate work, review changes, roll back, and integrate with others without overwriting.
- Who: You (individual focus) + future you (audit) + teammates + automation (CI).
- When: Every meaningful, coherent unit of change (not every keystroke; not whole week lumped together).
- Where: Local repo on your machine + remote (e.g., GitHub origin). Local = working copy + staging area + object database.
- How: Stage changes → commit snapshot with message → share (push) → integrate (merge/rebase) → correct mistakes (revert/reset) → curate history (squash, cherry-pick) → tag releases.

Core Mental Pictures

| Concept | Plain Definition | Analogy |
| ------- | ---------------- | ------- |
| Repository | Folder + hidden .git database | A project vault with an indexed archive room |
| Commit | Immutable snapshot + message + parent pointer | A saved game checkpoint with a note |
| Branch | Movable label pointing to a commit line | A named bookmark moving forward as you add pages |
| HEAD | Your current viewpoint (current commit) | The camera you’re looking through right now |
| Remote | Another copy (usually shared) | The cloud locker you sync with |
| Staging (Index) | Prep area before commit | A packing table where you choose items for the box |

Primary Actions (Story Form)

1. Edit files (working directory changes).
2. Select which edits to include now (`git add` → staging area).
3. Freeze that selection as a snapshot (`git commit`).
4. Publish or sync (`git push` / `git fetch` + `git pull`).
5. Integrate others’ work (merge or rebase).
6. Refine history (optional: squash / cherry-pick / revert).
7. Mark important points (tags / releases).

Key Terms Deep Dive (Plain + Analogy + Minimal Command)

Branch

- Plain: A movable pointer to the latest commit in a line of work.
- Analogy: A TV series season line; each new episode extends the line and moves the season marker.
- Commands:
  - Create & switch: `git switch -c feature/pinch-fsm`
  - List: `git branch`
  - Delete merged: `git branch -d feature/pinch-fsm`

Checkout / Switch

- Plain: Change which commit/branch your working directory reflects.
- Analogy: Load a different saved game state to play from there.
- Modern form: `git switch <branch>` (safer). Old: `git checkout <branch>`.

Commit

- Plain: Record staged changes at a point in time.
- Analogy: Seal a box, label it, put it on the archive shelf.
- Command: `git add . && git commit -m "feat: add pinch metric ring buffer"`

Merge

- Plain: Combine two branch histories, creating a new commit tying them together.
- Analogy: Taking two diverging storylines and writing a closing chapter that reconciles both.
- Command: `git switch main; git pull; git merge feature/pinch-fsm`
- Fast-forward merge: If main had no new commits, pointer just advances (no merge commit needed).

Rebase

- Plain: Replay your commits onto a new base commit, producing new rewritten commits.
- Analogy: You wrote notes on sticky pages; rebase copies those notes onto the newest edition of the book.
- Command (update feature on latest main): `git switch feature/pinch-fsm; git fetch origin; git rebase origin/main`
- Use when: You want a straight line history (no merge bubbles) before publishing.
- Avoid rewriting commits already pushed & shared (unless coordinated) → creates confusion.

Cherry-Pick

- Plain: Copy one (or a few) specific commit(s) onto your current branch.
- Analogy: Photocopy a single recipe card from a different cookbook and insert it into yours.
- Command: `git cherry-pick <commit-sha>`
- Use when: You need just a fix from another line without merging everything.

Stash

- Plain: Temporarily shelf uncommitted changes so you can switch context.
- Analogy: Sweep the puzzle pieces into a labeled bag, clear the table, return later.
- Commands:
  - Save: `git stash push -m "WIP pinch thresholds"`
  - List: `git stash list`
  - Restore & keep stash: `git stash apply`
  - Restore & drop: `git stash pop`

Revert

- Plain: Create a new commit that undoes the effect of a past commit.
- Analogy: Issue a correction sheet rather than ripping out printed pages.
- Command: `git revert <commit-sha>`
- Safe for shared history (adds, doesn’t rewrite).

Reset (Careful)

- Plain: Move branch pointer (and possibly HEAD & working/staging state) to another commit.
- Analogy: Pretend later chapters never happened (locally) by moving the bookmark backwards.
- Modes:
  - `--soft` (keep staged)
  - `--mixed` (default; keep working changes)
  - `--hard` (discard changes)
- Example (undo last commit but keep edits): `git reset --soft HEAD~1`
- Don’t use `--hard` on a shared branch casually.

Tag

- Plain: Permanent label for a specific commit (often a release).
- Analogy: Gold foil sticker “v1.0” on a particular box on the shelf.
- Commands:
  - Create annotated: `git tag -a v0.1.0 -m "Initial deterministic goldens"`
  - Push all tags: `git push --tags`

Fetch / Pull / Push

- Fetch: Download remote changes (metadata) without merging (`git fetch origin`).
- Pull: Fetch then merge/rebase into current branch (`git pull --ff-only` recommended to avoid unintended merges).
- Push: Upload your branch commits to remote (`git push origin feature/pinch-fsm`).
- Analogy: Fetch = check mailbox; Merge/Rebase = integrate letters; Push = send letters you wrote.

Detached HEAD

- Plain: You checked out a specific commit (not a branch). New commits here are orphaned unless you create a branch.
- Analogy: Exploring an alternate timeline snapshot without naming it; if you walk away, it’s hard to find again.
- Fix: `git switch -c rescue-work` to preserve it.

Conflict

- Plain: Git can’t auto-merge overlapping edits; you must choose resolution.
- Analogy: Two authors rewrote the same paragraph; you manually craft the final paragraph.
- Markers in files: `<<<<<<< HEAD` / `=======` / `>>>>>>> other-branch`
- Resolve → `git add file` → `git merge --continue` (or `git rebase --continue`).

## Page 2 — Practical Workflow & Recipes

Daily Flow (Feature Branch Model)

1. Start fresh main: `git switch main; git pull --ff-only`
2. Create feature branch: `git switch -c feature/pinch-fsm-runner`
3. Commit logically: small, purposeful messages.
4. Sync if main advanced: `git fetch origin; git rebase origin/main`
5. Push branch: `git push -u origin feature/pinch-fsm-runner`
6. Open PR; after review merge (prefer fast-forward or squash) back to main.
7. After merge: delete local + remote branch.

Good Commit Message Shape

feat(pinch): add event ring buffer for pinch hysteresis

- Imperative present (“add” not “added”).
- Scope in parentheses optional but helpful.

Choosing Merge vs Rebase

- Working alone / not yet pushed: rebase frequently to stay linear.
- Shared public branch already reviewed: merge (avoid rewriting history others may have pulled).
- Policy compromise: Rebase before first push; after others depend on it, merge.

When to Cherry-Pick vs Merge

- Need one hotfix commit on main now, full feature branch still evolving → cherry-pick.
- Need all changes + history → merge or rebase.

Recover From “Oops” Table

| Situation | Command | Why |
| --------- | ------- | --- |
| Forgot to include a file | add + commit --amend | Adjust last box label/contents |
| Want to undo last commit, keep edits | git reset --soft HEAD~1 | Reopen the sealed box |
| Want to discard local changes | git reset --hard HEAD | Clean slate (danger) |
| Need to back out a bad shared commit | git revert `<sha>` | Creates counteracting commit |
| Lost track of commit hash | git reflog | Timeline of HEAD positions |

Minimal Conflict Resolution Recipe

1. See conflict markers.
2. Edit file to final desired content (remove markers).
3. `git add file`
4. If merging: `git merge --continue` | If rebasing: `git rebase --continue`
5. Run tests; commit completes.

Lightweight History Curation (Before First Push)

- Squash multiple WIP commits into one: `git reset --soft <earlier-sha>`; `git commit -m "feat: coherent message"`
- Interactive rebase (reorder / squash / fixup): `git rebase -i HEAD~5`

Safety Nets

- Show staged vs last commit: `git diff --cached`
- Show what will be committed (short): `git status`
- Show summary graph: `git log --oneline --graph --decorate --all`
- Backup branch before risky ops: `git branch backup/pre-rebase-<date>`

Golden Rules (Memorize)

- Rebase private, merge public.
- Commit small & meaningful; message tells a reviewer “why”, diff shows “what”.
- Never panic: reflog can usually rescue “lost” commits.
- Prefer `--ff-only` pulls to avoid accidental merge commits.
- Tag important stability points (e.g., frozen goldens alignment).

Practice Ladder (Level Up Steps)

1. Master add / commit / branch / switch / push / pull.
2. Add rebase (keeping feature current with main before PR).
3. Learn revert (safe undo) vs reset (local surgical history adjust).
4. Cherry-pick targeted fixes.
5. Interactive rebase for polishing before tagging.

Quick Reference (Copy/Paste Friendly)

```bash
# Create & switch
git switch -c feature/thing

# Update feature with latest main (linear)
git fetch origin
git rebase origin/main

# Merge feature back (fast-forward if possible)
git switch main
git pull --ff-only
git merge feature/thing
git push

# Undo last commit but keep changes
git reset --soft HEAD~1

# Safe undo of a pushed commit
git revert <sha>

# Pick one commit from elsewhere
git cherry-pick <sha>

# Stash & return
git stash push -m "wip"
git stash list
git stash pop
```

Next Action For You

- Practice: create a throwaway repo and deliberately exercise each verb above once.
- After comfort: integrate tags & cherry-pick into real workflow.

End.
