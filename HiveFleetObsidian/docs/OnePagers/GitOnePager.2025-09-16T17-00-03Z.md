# Git - One-Pager
Generated: 2025-09-16T17-00-03Z

What it is
- Git is your project time machine and safety net: it tracks every meaningful change so you can move forward fast without losing the path back.
- Think of it as a layered notebook: the working tree is pencil edits, the staging area is what you plan to photocopy, and commits are the permanent pages.

Why it matters
- Lets teams collaborate without overwriting each other by merging changes instead of emailing zip files.
- Provides an audit trail for who changed what, when, and why.
- Powers automation: Husky, GitHub Actions, and releases all hang off Git events.

Core moves
1. Edit files in your working tree (VSCode, terminal, etc.).
2. Check `git status` to see modified files.
3. Stage intended files with `git add path` (build the snapshot).
4. Commit with a message that says why (`git commit -m "Explain the change"`).
5. Push to share the commit (`git push origin your-branch`).

Daily habits
- Start work with `git pull --rebase` (or `git fetch` + `git rebase`) so your branch is up to date before you add new commits.
- Create feature branches (`git switch -c feature/name`) instead of committing on `main`.
- Write messages that tell the story: "Fix husky guard" beats "WIP".
- Review the diff (`git diff --staged`) before committing; it is your pre-flight checklist.

When things go sideways
- Undo staged-but-wrong files with `git restore --staged path`.
- Drop local edits with `git restore path` if you have not committed yet.
- Amend the most recent commit with `git commit --amend` (use sparingly once shared).
- Recover lost work via `git reflog` which lists where HEAD has been.

Best practices
- Commit early, commit often. Smaller commits are easier to test, review, and revert.
- Keep branches short-lived; merge or delete once they land to avoid drift.
- Sync with remote frequently so your teammates see progress and conflicts stay small.
- Use `.gitignore` to keep build artifacts and secrets out of the repo.
- Tag releases (`git tag v1.2.0 && git push origin v1.2.0`) so you can tie builds to code snapshots.

Terms to know
- Working tree: your current files on disk.
- Stage (index): the set of changes queued for the next commit.
- Commit: an immutable snapshot with metadata, linked to a parent history.
- HEAD: your current location in the commit graph.
- Remote: a named server copy (e.g. `origin`).
- Rebase vs merge: rebase rewrites your local history atop another branch; merge creates a new commit tying histories together.

Quick commands
- `git status -sb` for a concise status overview.
- `git log --oneline --graph --decorate --all` to visualize branches.
- `git switch` to move between branches (`git switch -` jumps back).
- `git stash push -m "label"` to shelve work-in-progress and return later.
- `git clean -fd` to remove untracked files (dangerous; review before running).
