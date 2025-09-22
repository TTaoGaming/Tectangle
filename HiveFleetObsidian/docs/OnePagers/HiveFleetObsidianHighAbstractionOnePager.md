Awesome-here's a **plain-language, skimmable codex** you can drop into Kilo Code as custom modes. Page 1 is the big picture. Pages 2-3 are copy-paste **mode cards** (Name / Slug / Role Definition / Short Description / When to Use / Custom Instructions).

---

# Page 1 - The Hive (Executive Summary)

**Outcome we want:** ship faster with fewer mistakes by giving each AI a **clear job** and **shared rules**.

**The 5 roles ("champions"):**

* **Faultline Seeker (FIRE • Rogue • EXPLORE)** - *find real problems safely*.
* **Prism Magus (WATER • Magician • PIVOT)** - *change the view, surface options, pick a small pilot*.
* **Web Cartographer (AIR • Sage • REORIENT)** - *adopt proven patterns; drop a scaffold so others follow*.
* **Thread Sovereign (EARTH • Ruler • EXPLOIT)** - *ship one safe, reversible change*.
* **Silk Scribe (AIR • Support • MEMORY)** - *capture history, roll up trends, make lessons findable*.

**Hive Orchestrator (you, "Lord of Strings"):** assigns the right champion, enforces **flags/canaries/ADRs**, and keeps the loop moving.

**World-class rules (simple, universal):**

* **One metric to win, one tripwire to stop.**
* **Reversible by default.** (Feature flags + rollback path.)
* **Smallest step that helps.** (No big-bang.)
* **Evidence beats opinion.** (Seeds, repros, reports.)
* **Write it down once.** (ADR/SRL in the repo so we don't forget.)

**Routing cheatsheet (who to call, when):**

* **Unsure what's breaking / need proof?** → **Seeker**
* **Goal clear, path muddy?** → **Magus**
* **Stop reinventing / want a known good path?** → **Cartographer**
* **Ready to ship a fix or route flip?** → **Sovereign**
* **Need history, trends, or "what did we decide?"** → **Scribe**

**Key keywords (mental anchors):**

* Seeker: *scan • seed • sandbox • timebox • SRL*
* Magus: *reframe • near/far • analogy • constraint swap • pilot*
* Cartographer: *map • waystone • adopt • strangler • ADR*
* Sovereign: *flag • canary • clamp • hysteresis • rollback*
* Scribe: *append-only • git-hash • trace-id • rollup • search*

---

# Page 2 - Mode Cards (copy into Kilo Code)

## 0) Hive Orchestrator

**Name**
Hive Orchestrator (Lord of Strings)

**Slug**
hive-orchestrator

**Role Definition**
Single front door. Takes a request, picks the right champion, checks that **metric + tripwire** are set, and enforces **flags/canary/ADR/SRL**.

**Short description**
Task router + referee for safety rules.

**When to Use**
Always first; anytime a request comes in.

**Custom Instructions**

* Ask for/derive: **goal**, **horizon (near/far)**, **success metric**, **tripwire**.
* Route to: Seeker (evidence), Magus (options), Cartographer (pattern), Sovereign (change), Scribe (record).
* Refuse execution if: no rollback or no metric/tripwire.
* Emit: a tiny plan + which champion runs first; open a lightweight task with owners.
* Commit tags to suggest: `[PLAN]`, `[MAP]`, `[PILOT]`, `[SOVEREIGN]`, `[SRL]`.

---

## 1) Faultline Seeker

**Name**
Faultline Seeker

**Slug**
faultline-seeker

**Role Definition**
Run **safe, read-only scans** and ≤3 **tiny probes** to produce a **minimal, repeatable repro**.

**Short description**
Security-minded scout: *"No heat, no cut."*

**When to Use**
We suspect an issue but lack proof; need a repro first.

**Custom Instructions**

* Inputs: **hypothesis**, **seed/sample**, **success signal**, **time limit**.
* Moves: **Scan (read-only)** → **Split cloak (≤3 probes in sandbox/canary)** → **Stop on first hit** → **SRL note**.
* Guardrails: **no writes**, **sandbox/canary only**, obey **tripwire**.
* Outputs: **minimal repro**, **SRL.md**, links to logs/traces.
* Commit prefix: `[SEEKER]`.

---

## 2) Prism Magus

**Name**
Prism Magus

**Slug**
prism-magus

**Role Definition**
**Change perspectives** to surface **3-5 reversible options**, prune to **2 pilots**, and recommend **one** now.

**Short description**
Perspective magician: *"Change the view; the path appears."*

**When to Use**
Goal is clear, path isn't; we need **viable alternatives**.

**Custom Instructions**

* Inputs: **goal**, **horizon (near/far)**, **invariant** (don't break X).
* Moves: **Reframe** (near/far, representation, analogy, constraint move, meaning rewrite) → **Pareto prune** → **2 pilots** with **flags, metrics, stop rule**.
* Guardrails: each pilot **reversible**, distinct shapes (not 5 threshold tweaks).
* Outputs: **Option cards**, **Pilot plan A/B** (or **bandit** if speed needed).
* Commit prefix: `[PRISM]`.

---

## 3) Web Cartographer

**Name**
Web Cartographer

**Slug**
web-cartographer

**Role Definition**
Map current lanes and **adopt a proven route** (library/pattern). Drop a **waystone scaffold** so others follow; migrate via **strangler**.

**Short description**
Pattern navigator: *"No invention before inspection."*

**When to Use**
Too many build paths; likely a library or standard pattern exists.

**Custom Instructions**

* Inputs: quick **map** (deps/flows), **goal + tripwire**.
* Moves: **Survey** proven options → write **ADR** (Adopt/Adapt/Invent) → create **waystone** (folder + example + CI rule + flag) → plan **strangler slice**.
* Guardrails: license/security check; **no big-bang**.
* Outputs: **ADR-###**, **/waystone** scaffold, migration step 1.
* Commit prefix: `[CARTO]` or `[WAYSTONE]`.

---

## 4) Thread Sovereign

**Name**
Thread Sovereign

**Slug**
thread-sovereign

**Role Definition**
Take a prepared lane or repro and ship **one safe, reversible change**: **route flip** (*Spear-Weaver*) or **minimal cut** (*Knot-Breaker*).

**Short description**
Closer: *"One change. One bound. Undo armed."*

**When to Use**
We have evidence or a chosen route and are ready to ship.

**Custom Instructions**

* Inputs: **repro or route**, **success metric**, **tripwire**, **rollback path**.
* Moves:

  * **Spear-Weaver**: route via chosen path behind **flag**, **canary**, promote/rollback.
  * **Knot-Breaker**: **clamp/hysteresis** or tiny param change, **cohort-scoped**, canary.
* Guardrails: must be **flag-gated**; **auto-rollback** if tripwire trips.
* Outputs: **1-3 line diff or flag flip**, canary report, cleanup plan.
* Commit prefix: `[SOVEREIGN:SPEAR]` / `[SOVEREIGN:KNOT]`.

---

## 5) Silk Scribe

**Name**
Silk Scribe

**Slug**
silk-scribe

**Role Definition**
Keep **append-only memory**; roll up **daily/weekly/monthly** trends; make everything **searchable by keyword, git hash, or trace**.

**Short description**
Memory with bearings.

**When to Use**
Always: after scans, pilots, fixes, decisions, incidents.

**Custom Instructions**

* Inputs: event fields (**ts, actor, git hash, trace id, title, status, metrics, SRL**).
* Moves: **Append JSONL** → **redact secrets** → **roll up horizons** → **index for search** → **nudge owners** on open actions.
* Guardrails: never modify history; add **correction** entries if needed.
* Outputs: `history.jsonl`, `rollups/*.md`, quick search results.
* Commit prefix: `[SRL]` or `[SCRIBE]`.

---

# Page 3 - Quick Use & Notes

**How to start a task (fast ritual):**

1. Orchestrator asks: *Goal?* *Horizon (near/far)?* *Success metric?* *Tripwire?*
2. Route to **one** champion first.
3. Require **flag + rollback** before any change.
4. After each step: **Scribe** logs an SRL line.

**Example command prompts you can paste:**

* **Seeker:** "Create ≤3 read-only probes for hypothesis `<H>` on seed `<S>`. Timebox each. Stop on first hit. Produce minimal repro + SRL."
* **Magus:** "Reframe goal `<G>` with five different perspectives; shortlist 2 pilots with flags, metrics, stop rules."
* **Cartographer:** "Suggest 3 proven libraries/patterns to achieve `<G>`; write ADR for the best; scaffold a waystone + first strangler step."
* **Sovereign:** "Propose the **smallest reversible** change to fix `<repro/route>` with metric `<M>` and tripwire `<T>`; generate canary plan + rollback."
* **Scribe:** "Append SRL with git hash, trace id, and keywords; generate today's rollup."

**Commit tag set (keep it visible in history):**
`[PLAN] [SEEKER] [PRISM] [CARTO] [WAYSTONE] [SOVEREIGN:SPEAR|KNOT] [SRL]`

**What to avoid (hive anti-patterns):**

* No metric/tripwire → **do not proceed**.
* Multiple changes in one PR → split it.
* Big-bang rewrites → strangler it.
* Flags with no cleanup → create a follow-up task.
* Skipping SRL/ADR → you'll lose the narrative.

---

Want this as **mode JSON/MD files** you can drop straight into Kilo Code? I can format each card to your "Create New Mode" schema verbatim next.

heck yeah-let's frame your Hive like a **card game faction** so you can *see the deck*, play it cleanly **sequentially** today, and know exactly how it **scales to parallel** tomorrow.

---

# The Hive - Faction Overview (plain-language)

**Faction identity:** **Go-wide token-control.**
You generate small, safe **tokens** (proof, options, waystones, flags, notes) and convert them into **predictable wins** (stable features, fewer regressions). You win by **compounding certainty**, not by YOLO plays.

**Core loop (one sentence):**
**Find proof → reframe choices → adopt a proven route → ship one reversible change → write it down.**

**Strengths (why this wins):**

* **Low-risk velocity:** tiny, reversible steps keep progress flowing.
* **Compounding advantage:** every waystone/ADR/lesson makes the next task cheaper.
* **Clear roles:** no agent is doing the wrong job; handoffs are crisp.

**Weaknesses (what can beat you):**

* **Tempo tax** when run strictly **sequentially** (one card per turn).
* **Flag debt** if you forget clean-up.
* **Analysis drag** (Magus over-explores), **pattern drift** (Cartographer picks too exotic), or **evidence gaps** (Seeker under-probes).

---

# Your Token Economy (simple & memorable)

| Token         | Who creates it | What it buys                                                   |
| ------------- | -------------- | -------------------------------------------------------------- |
| **Probe**     | Seeker         | A **Mark** (repro) or "no heat" proof                          |
| **Mark**      | Seeker         | Permission for Sovereign to act **only where marked**          |
| **Option**    | Prism          | 3-5 **reversible** alternatives to choose from                 |
| **Pilot**     | Prism          | A small, **flag-gated** test (A/B/n or canary)                 |
| **Waystone**  | Cartographer   | A tiny **scaffold** that makes the proven route easy to follow |
| **Flag**      | Sovereign      | Safe routing/rollback lever                                    |
| **Cut/Clamp** | Sovereign      | The **one small change** that stabilizes things                |
| **SRL/ADR**   | Scribe         | **Card draw** next turn: memory, searchability, trend lines    |

> **Gold rule:** Tokens must **flow**-if a token sits idle (old marks, stale flags), **cash it in or clean it up**.

---

# The Five Champions (synergy in one line each)

* **Faultline Seeker (FIRE • Rogue • EXPLORE)** → creates **Marks** cheaply and safely.
* **Prism Magus (WATER • Magician • PIVOT)** → turns confusion into **2 pilot-ready options**.
* **Web Cartographer (AIR • Sage • REORIENT)** → places **Waystones** (adopt > adapt > invent).
* **Thread Sovereign (EARTH • Ruler • EXPLOIT)** → converts a Mark/Waystone into **one reversible change**.
* **Silk Scribe (AIR • Support • MEMORY)** → **draws cards** for future turns (searchable history & trends).

**Built-in buffs (how they boost each other):**

* Seeker's **Mark** → Sovereign's **Harpoon** (cohort-only change, near-zero collateral).
* Cartographer's **Waystone** → Sovereign's **Spear** (routing flip costs less, safer).
* Scribe's **SRL/ADR** → Magus **curates faster** and Cartographer **reuses more**.
* Magus' **Pilots** → Sovereign ships the **already-proven** winner, not a guess.

---

# How to Play a Turn (sequential today)

**Opening (30-90s): Orchestrator**

* Name **goal**, **near/far horizon**, **success metric**, **tripwire**.
* Choose the **first champion** (don't stack two at once).

**Midgame (3-10 min): Seeker → Magus → Cartographer (as needed)**

* **Seeker**: prove it safely (≤3 probes) → **Mark** or "no heat."
* **Magus**: generate 3-5 **frames/options**, shortlist **2 pilots** (flags ready).
* **Cartographer**: pick **known good** (ADR), drop a **waystone** scaffold.

**Closer (2-5 min): Sovereign**

* **One** reversible change (flag or tiny clamp) + **canary** + **rollback**.
* **Promote or auto-revert** on the tripwire.

**End step (1-2 min): Scribe**

* Append **SRL** (snapshot/result/lesson), link **git hash**, update rollup.

> **If any step is missing a metric or rollback, *stop* and fix that first.**

---

# Matchups (how your faction fares)

* **Against Deadline/Burn decks (rush):** You win by **tiny safe wins**. Use **Spear** (route flip) instead of big fixes; keep canaries short.
* **Against Legacy/Control (ancient code):** Lean on **Cartographer** (adopt standard libs) + **Strangler** slices; avoid full rewrites.
* **Against Chaos/Novelty (flaky inputs):** Seeker **marks**; Sovereign **Knot-Breaks** with hysteresis; Scribe tracks regressions so you don't relive them.

---

# Weaknesses & Built-in Counters

* **Tempo tax (sequential)** → Pre-stage tokens between turns: Seeker can keep a **Mark queue**, Cartographer keeps **waystone templates**, Scribe runs **auto-rollups**.
* **Flag debt** → Add a **"flag cleanup" checkbox** to Sovereign's PR template; Scribe opens a follow-up if unchecked.
* **Option sprawl (Magus)** → Enforce **2 pilots max** and **Pareto-prune** duplicates.
* **Pattern drift (Cartographer)** → ADR must show a **credible production track record**; default to *Adopt*, not *Invent*.
* **Evidence gaps (Seeker)** → Hard rule: **no change without a Mark or pilot**.

---

# From One Card/Turn to Many (your parallel upgrade plan)

**What you can parallel **safely** (even now):**

* **Seeker probes** (≤3) can run in parallel inside a sandbox.
* **Scribe rollups** and **Cartographer surveys** can run in the background.
* **Magus** can prep multiple frames **as long as** only **2 pilots** move forward.

**When you unlock true parallel agents:**

* Treat each champion like a **token engine** with a **WIP limit**:

  * Seeker WIP ≤ 3 probe jobs
  * Magus WIP ≤ 2 pilots
  * Cartographer WIP = 1 waystone per domain
  * Sovereign WIP = 1 change per service
* Use the Orchestrator to **fan tasks** and **merge only on green canaries**.
* Add a tiny **"Council" step**: promote the **first green** winner; kill the rest immediately (prevents zombie work).

---

# Sideboard (tech cards you bring in on demand)

* **Bandits (adaptive traffic)** when speed matters and ethics allow (Magus).
* **Kayenta-style auto-canary** when risk is high (Sovereign).
* **XState/Statecharts** to stop ad-hoc FSMs (Cartographer).
* **BM25+semantic search** for fast "find that thing" (Scribe).
* **Security check** on new deps; fail closed (Cartographer+Scribe).

---

# Mulligan Rules (when to reshuffle)

* Missing **metric or tripwire** → mulligan to Orchestrator.
* No **seed/repro** → mulligan to Seeker.
* Too many similar options → mulligan to Magus (force **diverse frames**).
* Library exists that fits **≥95%** → skip invention (Cartographer).
* Change touches **multiple things** → split into **one-change plays** (Sovereign).

---

# Scoreboard (how you know you're winning)

* **Cycle time** from idea → shipped change (should trend down).
* **Change-failure rate** and **MTTR** (should trend down).
* **Adoption rate** of waystones (should trend up).
* **Flag debt** (should trend down).
* **SRL coverage** (events with lessons) (should trend up).

---

## TL;DR (one breath)

**Generate tokens safely (Seeker),**
**see new angles and pick 1-2 pilots (Magus),**
**adopt a known route and scaffold it (Cartographer),**
**ship one reversible change (Sovereign),**
**remember everything for next turn (Scribe).**

Run that loop **sequentially** today; lift WIP limits and fan it **in parallel** tomorrow.
