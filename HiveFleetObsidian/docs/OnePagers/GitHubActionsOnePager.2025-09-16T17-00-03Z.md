# GitHub Actions - One-Pager
Generated: 2025-09-16T17-00-03Z

What it is
- GitHub Actions is the factory floor that spins up virtual machines to run scripts whenever code arrives in GitHub.
- Picture a row of robots that grab your branch, build it, run tests, and report back without you touching anything.

Why it matters
- Gives everyone the same verdict on builds and tests, no matter whose laptop they used.
- Catches issues before merge: failing workflows block pull requests until the problem is fixed or acknowledged.
- Automates routine chores (linting, releases, docs publishing) so humans do higher-value work.

How it works here
1. A push or pull request hits GitHub.
2. GitHub scans `.github/workflows/*.yml` for matching triggers.
3. Each workflow sets up jobs (e.g. `meta-check`, `ci`) that run on clean runners like `ubuntu-latest`.
4. Jobs run steps in order (`uses` for prebuilt actions, `run` for shell commands). Outputs and artifacts are stored alongside the run.
5. Results post back to the commit, the PR checks panel, and Slack/notifications if configured.

Daily rhythm
- Before pushing, run the same commands locally when practical (npm test, lint). Matching local and CI commands avoids wait-and-repeat loops.
- After pushing, open the PR checks pane or the Actions tab to confirm the green check. Treat it like waiting for X-rays before leaving the clinic.
- When a run fails, click into the job log, expand the red step, and copy the command to rerun locally. Fix, push again, and watch the follow-up run.

Best practices
- Keep workflows short and focused; long multi-purpose pipelines are harder to debug.
- Use caching (`actions/cache`) for dependencies to speed up repeated runs.
- Pin critical versions (`uses: actions/checkout@v4`) so upstream changes do not surprise you.
- Prefer secrets over hardcoded tokens. Store them in GitHub repo or org settings and reference with `${{ secrets.NAME }}`.
- Use required status checks on protected branches so merges only happen after critical workflows succeed.

When you need to iterate
- Use `workflow_dispatch` triggers for manual re-runs or parameterized jobs.
- For quick experiments, duplicate an existing workflow into a scratch branch instead of editing production YAML live.
- If a workflow blocks other work, leave breadcrumbs in the PR or issue: link the failing run, summarize the error, and note your next steps.

Terms to know
- Workflow: a YAML file describing triggers and jobs.
- Job: a unit of work that runs on one runner; jobs can run in parallel unless `needs` links them.
- Step: an individual command or action inside a job.
- Artifact: files uploaded from a run (logs, bundles, screenshots).

Quick commands and links
- `gh workflow view <name>` or `gh run watch` for live logs in the terminal (requires GitHub CLI).
- `.github/workflows` folder to edit or review pipelines.
- Actions tab > Failures filter to spot recurring issues.
