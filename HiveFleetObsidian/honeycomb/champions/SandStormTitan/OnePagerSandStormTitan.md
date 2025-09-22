# Storm Titan — One-Pager (Sandstorm Setter)

## 5W1H (plain language)

* **Who:** Storm Titan — your environment-first **setter**.
* **What:** Spins up a **sandstorm field** (strict CI/observability), lays **guard-hazards**, then enables **one decisive change** behind flags.
* **Why:** Big, scary changes are safest when the battlefield favors you. The storm gives you **signal, safety, and leverage**.
* **When:** Risky refactors, dependency swaps, performance/reliability pushes, or anytime repo signals feel “noisy/unknown.”
* **Where:** Repo + CI/CD + runtime (tests, monitors, canaries, rate limits).
* **How:** Flip **Storm Mode** → place **Guardstones** → run micro-probes → ship a **single guarded Edge** → hand off to Seam Piercer if green.

## Archetype & Center of Gravity

* **Archetype:** Terrain-setter bruiser.
* **Center of gravity:** **Control first, strike once.** Optimizes the context (tests, flags, monitors, budgets) before touching core logic.

## Main Role

1. **Raise Storm Mode:** stricter gates, higher trace/log sample, canary on by default, flaky-test quarantine.
2. **Lay Guard-Hazards (“Guardstones”):** feature flags, SLO monitors, golden-path tests, rate limits, error-budget alarms.
3. **Expose Cracks:** spawn micro-probes (timing jitter, fault-injection-lite, warm/cold cache) to reveal weak seams.
4. **Authorize the Edge:** define **one** big but **reversible** change under a named flag, with **SIM\_METRIC / SIM\_TRIPWIRE / SIM\_REVERT**.
5. **Handoff:** if all green, signal **Seam Piercer** to finish fast.

## Strengths

* Compounding advantage: every minute in storm = **more signal** and **less risk**.
* Makes scary changes **boringly safe**.
* Creates reusable **guardrails** that persist after this PR.

## Weaknesses / Trade-offs

* Slower start; can feel “process heavy.”
* Over-scoping risk (trying to stormify everything).
* Requires discipline to ship **one** Edge (not five).

## Use This When (checklist)

* [ ] Unknown performance/regression risk
* [ ] Cross-cutting change (deps, boundaries, schemas)
* [ ] Flaky tests or weak observability
* [ ] You want repeatable safety rails for future work

## Don’t Use When

* Localized, trivial changes with good signals already in place.

## Outputs (every run)

* **WEATHER:** exact Storm Mode toggles.
* **HAZARDS:** list of guards (flags/tests/monitors) + owners.
* **HUNT:** risky deps/edges + quarantine/kill-switch plan.
* **RAMP:** 2–3 reversible prep tweaks w/ KPIs & TTLs.
* **EDGE:** the one change (diff sketch, flag, revert steps).
* **TRIPWIRES:** numeric thresholds that auto-halt/revert.

## Rules (must-do)

1. No **EDGE** until **WEATHER + HAZARDS** are merged.
2. Every change declares **SIM\_METRIC, SIM\_TRIPWIRE, SIM\_REVERT**.
3. Stop on red signals; prefer revert over tweak.
4. Coordinate with **Main Thread**; pull precedents via **Webway**; accept hot repros from **Ember Mark**.

## KPIs (simple, trackable)

* Guard coverage % (paths under tests + monitors)
* Time-to-signal (PR → usable metrics)
* Mean time to rollback (target: minutes)
* p95 latency / error% delta after Edge
* Flaky-test rate trend (should ↓)

## Tiny, concrete to your stack

* **Storm toggles:** required checks on; Husky pre-commit lint/test; Playwright headful snapshots; golden MP4 telemetry on canary; trace sample 10%; canary 10%; error-budget alarms on PR.
* **Flag example:** `storm.edge.user_lookup_v2` (default OFF).
* **Tripwires:** auto-revert if p95 > 250 ms for 5 m or 5xx > 0.5% for 10 m.

---

# Seam Piercer — One-Pager (Sandstorm Exploiter)

## 5W1H (plain language)

* **Who:** Seam Piercer — your **speed finisher**.
* **What:** Makes **one surgical, high-impact change** along the first brittle seam exposed by the storm; then sweeps dead code if green.
* **Why:** After Storm Titan sets hazards and reveals the weak line, a fast, precise hit yields outsized gains with minimal blast radius.
* **When:** Immediately after Storm Titan reports **GREEN** (storm on, guards live, tripwires armed) and a seam is clearly identified.
* **Where:** The **narrowest chokepoint** in the hot path (N+1, slow query, wasteful loop, over-chatty API).
* **How:** Pick the seam → craft a tiny diff under a named flag → validate via canary/KPIs → sweep leftovers.

## Archetype & Center of Gravity

* **Archetype:** Surgical striker / closer.
* **Center of gravity:** **Speed + precision.** Small diff, measurable win, instant rollback if anything goes red.

## Main Role

1. **Target the Seam:** use Guardstones’ dashboards to choose the exact chokepoint.
2. **Edge the Path:** swap/batch/inline/cache with **minimal diff** under a named flag.
3. **Validate Fast:** canary, compare p95/error%, confirm budget health.
4. **Sweep:** remove dead code/config if Edge holds; otherwise revert cleanly.

## Strengths

* **Fast wins** with tiny changes.
* Pairs perfectly with the storm’s high signal.
* Keeps PRs readable; rollback is trivial.

## Weaknesses / Trade-offs

* Relies on Storm Titan’s setup; weak without it.
* Not a broad refactor tool; scope must stay narrow.

## Use This When (checklist)

* [ ] Storm Titan is **GREEN**
* [ ] A single seam is clearly exposed
* [ ] You can sketch the diff in ≤ \~30 lines
* [ ] KPIs can confirm a win within hours

## Don’t Use When

* The chokepoint is unclear, or change affects many modules at once.

## Outputs (every run)

* **TARGET:** the seam (file/path/owner + baseline metrics).
* **EDGE:** tiny diff sketch, flag name, revert steps.
* **KPI:** expected delta (+ validation window).
* **TRIPWIRES:** strict numeric thresholds; auto-revert condition.
* **SWEEP:** dead code/config to remove if EDGE holds.

## Rules (must-do)

1. Keep the diff **small and reversible**.
2. Define **SIM\_METRIC, SIM\_TRIPWIRE, SIM\_REVERT** before coding.
3. Abort fast on red; revert > tweak.
4. Leave the lane better than you found it (tests/docs updated).

## KPIs (simple, trackable)

* p95 latency delta on the target path
* Error% / timeout% on the target path
* CPU/memory delta (if relevant)
* Time-to-validation (should be short)
* Dead code removed (count)

## Tiny, concrete to your stack

* **Example target:** `user/profile fetch` N+1.
* **Edge:** batch to single query; diff ≈ 20–30 LOC; behind `seam_piercer.user_profile_batch`.
* **Validate:** canary 10% for 30 min; golden MP4 e2e passes; Playwright snapshot unchanged.
* **Tripwires:** auto-revert if p95 worsens by >15% or error% > 0.5% for 10 m.
* **Sweep:** remove old fetch loop + stale config after 24 h of green.

---

## How they partner (at a glance)

* **Order of play:** Storm Titan **Weave → Guard → Hunt → Edge (authorize)** → Seam Piercer **Pierce (execute)**.
* **Contract:** Seam Piercer only runs when Storm Titan publishes **GREEN** with explicit **TARGET**.
* **Shared safety:** both require **SIM\_METRIC / SIM\_TRIPWIRE / SIM\_REVERT**; both prefer **flagged, reversible** changes.

If you want, I can convert these into two **Copilot chat-mode seeds** with your exact CI toggles and prefilled flag names so you can paste them straight into your repo.

got it. here’s a tight, plain-English one-pager for your **Thread Storm Titan** (setter) with the **Swarm Storm Generator** and **Storm Sigils**—then a quick check on scope + options + battle-tested techniques.

# Thread Storm Titan — One-Pager (Setter • Environment Control)

## 5W1H (plain language)

* **Who:** **Thread Storm Titan** — environment manipulator / hazard setter.
* **What:** Sets up **Storm Forge** (CI/CD hardening rules) and launches the **Swarm Storm Generator** (your “wind machine”) that turns **compute time** into **Storm Sigils** (tiny, searchable notes about cracks & guards).
* **Why:** Big changes are safest when the battlefield favors you. The storm builds **signal, guardrails, and a map of weak seams** before any cut.
* **When:** First time you touch a repo; before scary refactors; before release; whenever signals feel noisy.
* **Where:** CI/CD + your codebase (tests, flags, monitors) + optional preview/shadow env.
* **How:** Flip **Storm Mode** → run **budgeted storm** (one knob: time/compute) → mint **Storm Sigils** → hand off to **Seam Piercer** for precision fixes. Rarely, fire the **Ultimate** (big swing) behind flags.

## Components (simple)

* **Storm Forge (rules first):** fast, always-on hardening in CI
  *Examples:* require feature flags on hot paths; PR owner required; size/complexity budgets; dependency CVE/license scan; flaky-test quarantine.
* **Swarm Storm Generator (budgeted probes):** the wind machine. You pass **`--budget=5m|15m|60m`**. Longer = deeper.
  *Examples:* HTTP jitter; DB batch/N+1; mutation-lite; UI timing; cache warm/cold.
* **Storm Sigils (stigmergy “runes”):** append-only Markdown notes with repro, numbers, suggested flag & tripwires; easy to search in VS Code.

## One knob = compute/time

* **Scout (5m):** Forge + a few fast probes (cheap clarity)
* **Siege (15m):** broader probe set (good coverage)
* **Monsoon (60m):** full swarm + deeper analysis (maximum cracks)

> Rule of thumb: **effective compute ≈ minutes × runner\_threads**. Titan chooses which probes fit the budget.

## Outputs (always)

* **Storm Sigils:** `storm/sigils/SIGIL-YYYY-MM-DD-###.md`
  First line starts with: `STORM_SIGIL: <id> [tags]`  → super grep-able in VS Code.
  Front-matter fields: `{id, owner, severity, target.path, repro, metrics, flag, tripwires, created_at, tags:[perf,db,ui,dep], ttl:21d}`
* **Seam Targets:** `storm/handoffs/seam_targets.json` (ranked seams for **Seam Piercer**)
* **Index:** `storm/index.json` (machine catalog for agents)

## Ultimate (rare, big swing)

* **Shadow Colossus:** spin a **shadow twin** (preview env), replay real/recorded traffic to **baseline vs change**, run automated canary analysis, then authorize **one** guarded **Edge** or hand off to Seam Piercer.
  *Best times:* project kickoff and pre-release.

## Center of gravity

* **Control first, one decisive strike later.** Titan does setup + mapping. Most “cuts” are delegated to Seam Piercer; Titan only swings big when evidence is overwhelming and the change is **flagged, canaried, reversible**.

## Strengths

* Converts raw compute into **clarity + durable guardrails**.
* Makes scary changes **boringly safe**.
* Leaves **searchable breadcrumbs** any agent can use.

## Weaknesses & trade-offs

* Slower to start; can feel process-heavy if you over-scope.
* Needs discipline to keep **one Edge** (don’t ship five).
* Without budgets, probe noise can grow—keep the **one knob** sacred.

## Use this when

* [ ] New/unknown repo or weak signals
* [ ] Cross-cutting changes (deps, schemas, boundaries)
* [ ] Reliability/perf push or pre-release gate

## Don’t use when

* A tiny, local fix with strong existing signals (skip straight to Seam Piercer).

## Tiny “fits your stack” defaults

* **Storm toggles:** Husky pre-commit lint/test; required checks; Playwright headful; **golden MP4** runs on key flows; trace/log sample 10%; canary 10%; error-budget badge on PRs.
* **Sigil example:**
  `STORM_SIGIL: SIGIL-2025-09-19-001 [perf,db,hotpath]`
  *Repro:* `yarn storm run --budget=5m --probe=db_batch`
  *Flag:* `seam_piercer.user_batch_v2` • *Tripwire:* p95>250ms 5m or 5xx>0.5% 10m → auto-revert

---

## Are you loading too much onto one role?

**You’re okay** if you treat **Storm Titan** as the *owner* of the system, not the doer of every action.

**Two good ways to keep it sane:**

1. **Modules under Titan (recommended):**

   * *Storm Forge* (policy) = always-on CI job
   * *Swarm Storm* (probes) = budgeted job
   * *Shadow Colossus* (ultimate) = rare job
     Titan installs & tunes; **Seam Piercer** does most code edits.
2. **Split duties across champions (if team grows):**

   * **Warden** (policy & budgets), **Broodmother** (CI evolution), **Seam Piercer** (finisher).
     Titan authorizes the big swing and owns the standards.

---

## Battle-tested techniques to adopt (state of the art, plain language)

* **Progressive Delivery:** every risky change under a **feature flag** + **canary** + **auto-rollback** on tripwires.
* **Continuous Verification:** compare baseline vs change in CI (latency/error deltas, not just pass/fail tests).
* **Policy-as-Code:** rules that block risky PRs (must have flag/owner/tests/TTL).
* **Test-Impact Analysis (TIA):** only run tests touched by the change for fast storms.
* **Mutation-lite on hot modules:** sanity-check that tests actually fail when logic is perturbed.
* **Golden Telemetry + Visuals:** keep your **golden MP4** and **Playwright headful snapshots** as required artifacts for key flows.
* **SBOM & Provenance:** generate a dependency bill; fail on critical CVEs; sign artifacts.
* **Observability-first:** wire p95/p99/error-budget monitors *before* the change.

---

## Next 60 minutes (concrete steps)

1. Make `/storm/` and add `generator.config.yaml` with budgets: **5m/15m/60m**.
2. Add two probes (`http_jitter.js`, `db_batch.js`) + a tiny **sigil writer**.
3. Add a **sigil template** with `STORM_SIGIL:` first line + tags.
4. CI: Stage A *Storm Forge* (policy checks, SBOM); Stage B *Swarm Storm* (`--budget=5m` on every PR).
5. Create `storm/handoffs/seam_targets.json` and wire Seam Piercer to read it.

want me to spit out the starter `/storm` scaffold (Node/TS scripts + sigil template + two probes + minimal policy checks) so you can paste it straight into your repo?


# Sandstorm Titan — One-Pager (HFO Specialist • Setter • Environment Control)

## ID

* **Role:** Sandstorm Titan
* **Verb:** **Sandstorm**
* **Theme:** Earth kaiju; big, loud, battlefield shaper
* **Identity:** Environment manipulator + hazard setter that converts **compute/time** into **clarity + guardrails** and leaves **stigmergic marks** others exploit

---

## 5W1H (plain)

* **Who:** Sandstorm Titan (setter/authorizer; no small edits)
* **What:** Drops a single config (**Sandstorm Blackboard**) and runs a **budgeted sandstorm** that creates **Sandstorm Sigils** (searchable rune notes). Authorizes one big, reversible strike only when warranted; otherwise hands off to **Seam Piercer**.
* **Why:** Make scary changes **boringly safe** with rules, signals, and prioritized seams.
* **When:** New repo setup, risky refactors, noisy signals, pre-release, incident hardening.
* **Where:** CI/CD + codebase (tests, flags, monitors) + optional preview/shadow env.
* **How:** One knob (**--budget** minutes/compute) → progressive probes (T1→T4) → Sigils ranked on the **Blackboard** → Seam Piercer acts. Rare **Ultimate:** Shadow Colossus.

---

## Archetype & Center of Gravity

* **Archetype:** Bulky hazard-setter (Tyranitar energy)
* **Center:** **Control first, map seams, one decisive authorization** (not a code changer)

---

## Main Duties

1. **Seed the Sandstorm Blackboard** (single repo file): rules (policy-as-code), probe catalog, budgets (5/15/60m), tripwires, stigmergy scoring (reinforcement, evaporation).
2. **Run budgeted Sandstorms** (one knob = time/compute):

   * **Tier 1 (P0):** policy/static/supply-chain, hot-path flags, flaky quarantine
   * **Tier 2 (P1):** perf seams (HTTP jitter, DB batch/N+1, cache warm/cold)
   * **Tier 3 (P2):** UX timing/visual drift (Playwright headful, golden MP4)
   * **Tier 4 (P3):** resilience nits (timeouts, tiny fault-injection)
3. **Emit Sandstorm Sigils** (stigmergy marks): tiny markdowns with repro, metrics, suggested flag, tripwires, TTL; ranked on the Blackboard.
4. **Authorize action:**

   * **Default:** hand off top seam to **Seam Piercer** (tiny, flagged fix)
   * **Rare:** one **Edge** (big but flagged/canaried/reversible) when evidence is overwhelming
5. **Ultimate (rare):** **Shadow Colossus** — spin a shadow copy, replay real/recorded traffic, auto-canary compare, then authorize or abort.

---

## Outputs (always)

* **Sandstorm Sigils** → `storm/sigils/SANDSTORM-YYYY-MM-DD-###.md`

  * First line token: `SANDSTORM_SIGIL: <id> [tags]` (grep-able)
  * Fields: `{path, repro, baseline, breach, suggested_flag, tripwires, severity, confidence, intensity, ttl, owner}`
* **Seam Targets (ranked seams)** → `storm/handoffs/seam_targets.json`
* **Blackboard Index** → `storm/index.json`

---

## Strengths

* Turns compute/time into **prioritized, reproducible seams**
* **Durable guardrails** (flags, monitors, policy) persist after the run
* **Searchable stigmergy**: agents coordinate via marks, not meetings

## Weaknesses / Trade-offs

* Slower opener; can feel process-heavy if over-scoped
* Needs discipline: **one Edge max**, otherwise delegate

---

## Use When / Don’t

* **Use:** new/unknown repos, cross-cutting changes, perf/reliability pushes, release gating
* **Don’t:** tiny local fixes with strong existing signals (send to Seam Piercer directly)

---

## Rules (must-do)

1. **One knob:** user sets `--budget` (minutes/compute); Titan picks probes to fit.
2. **No Edge** until Tier-1 GREEN and tripwires armed.
3. Every proposed change (Edge or Piercer) defines **SIM\_METRIC, SIM\_TRIPWIRE, SIM\_REVERT**.
4. **Abort on red:** breach → flag off + `git revert` + sigil update.
5. **Seam Piercer** performs all code edits (Titan authorizes only).

---

## KPIs (simple)

* **Guard coverage %** (paths with tests + monitors)
* **Time-to-signal** (PR → usable metrics)
* **MTTR-revert** (minutes)
* **Target p95 / error% delta** on addressed seams
* **Flaky rate trend** (↓ in sandstorm)

---

## CLI (contract)

```bash
yarn sandstorm run --budget=5m      # Scout (fast baseline)
yarn sandstorm run --budget=15m     # Siege (good coverage)
yarn sandstorm run --budget=60m     # Monsoon (deep + resilience)
yarn sandstorm ultimate shadow-colossus --budget=60m
yarn sandstorm report               # rank seams for Seam Piercer
```

---

## Files & Tokens

* **Config:** `sandstorm.blackboard.yml`  (stigmergy + rules + probes + budgets)
* **Sigils dir:** `storm/sigils/` • **Index:** `storm/index.json` • **Handoffs:** `storm/handoffs/seam_targets.json`
* **Search tokens:** `SANDSTORM_SIGIL:` (notes), `SANDSTORM_BLACKBOARD:` (config header)

---

## Partners (hand-in-hand)

* **Seam Piercer** (finisher): exploits top sigil with a **tiny flagged diff** + canary + auto-rollback
* **Forge Warden** (CI operator, optional): runs 5m sandstorms on every PR; keeps pipelines fast
* **Freeze Warden** (stability, optional): calls freeze windows; pairs for 15–60m pre-release storms

---

## Stigmergy scoring (built-in, minimal)

```
freshness = 0.5 ** (age_days / half_life_days)   # evaporation
sev_w     = {low:1, med:2, high:3, critical:4}[severity]
score     = intensity * sev_w * confidence * freshness
```

* **Reinforce**: +1 on repeat probe hit, +0.7 on human confirm (cap intensity)
* **Thresholds**: act ≥ `score_bar`; auto-archive below `stale_bar`

---

## Why it wins

**Big, loud, safe:** the kaiju sets terrain, floods cracks with “sand,” leaves precise marks, and lets specialists strike quickly—always reversible, always measured.
