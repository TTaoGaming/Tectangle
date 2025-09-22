# Husky for VSCode - One-Pager
Generated: 2025-09-16T17-00-03Z

What it is
- Husky is the repo's bouncer: before Git lets your commit walk through the door, Husky runs small scripts to check that everything looks right.
- In this project it mainly lives in the `.husky` folder and runs Node scripts (like `guard_chatmode_commits.mjs`) whenever you `git commit` from VSCode, the CLI, or any tool that calls Git.

Why it matters
- Saves reviewers from preventable issues such as broken tests, missing metadata, or invalid chatmode edits.
- Keeps your local workflow aligned with CI so surprises do not show up later in GitHub Actions.
- Makes habits automatic: you focus on code, Husky enforces the checklist.

How it works here
1. VSCode (or the shell) asks Git to commit.
2. Git calls Husky's `pre-commit` script.
3. The script runs quick commands (lint, file guards, formatting). If any command exits with a nonzero status, Git aborts the commit.
4. You fix what failed, stage again, and retry the commit.

Daily rhythm in VSCode
- After you save, run `git status` in the Source Control view: confirm only the files you expect are staged.
- When you press Commit, watch the terminal panel Husky opens; the failure message usually names the exact script.
- If Husky edits files for you (for example lint fixes), it stops the commit so you can review and re-stage the edits Husky made.

If Husky blocks you
- Think of it like a smoke detector. Clearing the smoke (fixing the issue) is better than removing the batteries.
- Run the same command manually, e.g. `node scripts/guard_chatmode_commits.mjs`. The log shows which files triggered it. The chatmode guard only allows commits that include an approval note; it breaks the commit so you can double-check.
- If you truly need to bypass (rare), use `HUSKY=0 git commit ...`, but follow up with a fix or explanation in the pull request.
- When changes keep reappearing, use `git status --short` to confirm nothing else is staged, and `git restore --staged path` or `git checkout -- path` to clear leftovers before retrying.

Best practices
- Keep dependencies installed: run `npm install` after cloning so Husky scripts find their tools.
- Prefer committing from a terminal inside VSCode; you see the full Husky output and can rerun commands quickly.
- Break work into focused commits. Husky checks run faster and errors are easier to isolate.
- Pair Husky with unit tests: run the relevant test file before committing so Husky becomes a confirmation, not a surprise.

Terms to know
- Git hook: the trigger Husky uses (`pre-commit`, `commit-msg`, etc.).
- Exit code: `0` means success, anything else blocks the commit.
- Stage (index): the files Git thinks belong in the next commit; Husky only inspects staged content.

Quick commands
- `npx husky install` if hooks ever disappear (run once).
- `HUSKY=0 git commit` to bypass in emergencies (follow with a fix).
- `.husky/pre-commit` to see exactly what runs before every commit.
