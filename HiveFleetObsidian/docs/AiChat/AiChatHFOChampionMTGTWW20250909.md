Ohhhh yes-that image is perfect. Here's **Thread Sovereign** rethemed as you asked: a **mountain woven from living thread**, crowned, plated in **load-bearing armor**, and wielding a **transforming thread-weapon** (spear / blade / hammer). It's literally the **state-action space** made manifest: lanes (threads), anchors (nodes), and one **decisive, shielded strike** when the weave is ready.

---

# Thread Sovereign - **Earth • Ruler • Exploit**

## Visual core (design tokens)

* **Silhouette:** a **thread-mountain** with terraced planes and tension cables; broad, immovable stance.
* **Crown:** **Crown of Loomstone**-a circlet of braided load-threads tied into node-runes.
* **Armor:** dark stone-plates stitched with glowing seams (the **guardrail weave**).
* **Weapon:** **Threadform** (modal): **Spear** (reach line), **Blade** (precision edge), **Hammer** (impact plate).
* **Palette:** basalt/earth with muted gold seams; faint teal telemetry in the threads.
* **Motion:** slow setup → one clean transform → short **Grounding Step** back into cover.

## Mechanic metaphor (how it "thinks")

* **Threads = action lines**, **Nodes = anchors**. He **routes force** along prepared lines.
* **Exploit = one modal operator:**

  * **Spear:** reach & commit along a clean lane (cross-module flag/route flip).
  * **Blade:** precise **threshold/clamp** cut (tiny parameter/logic change).
  * **Hammer:** quell oscillation (**debounce / hysteresis / aggregation**) to stabilize.
* **Shielding:** the crown's guardrails absorb mis-aim-**reversible by design**.

**Gate rule:** **No Weave, No Strike.** (Tagged target, node cover, clear rollback, metric bound.)

**Pocket mnemonic:** **MOUNT** → *Marked • One Node cover • Undo path • Numeric target • Threadform chosen.*

---

## Lens 1 - **Magic: The Gathering** (values & guardrails)

**Colors:** **G/W** (Earth + Order), splash **B** only when trading health for certainty.

**Legendary • Earthwoven Sovereign** *(vibe text)*

* **Weave-Ready** - Cast your next small spell **only if a foe is Marked or you control a Node**; if it would fail, **return it to hand**.
* **Threadform - Choose one:**

  * **Spearform**: *route a change across the lane* (safe global flip gated by flag).
  * **Bladeform**: *slice a parameter/threshold* (tiny, exact patch).
  * **Hammerform**: *quell oscillation* (attach debounce/hysteresis clause).
* **Crown of Loomstone (Artifact):** Your changes have **shield text**: "If risk > bound, **bounce**."

**MTG mantra:** **ROOT → Ready • Observe • Overmatch • Trigger.**

---

## Lens 2 - **Total War: Warhammer** (roles & timing)

**Battlefield role:** **Earth-Lord Finisher/Commander.** Swings once on prepared ground; never first.

**Stances (weapon transform):**

* **Spearform (Reach Stance):** anti-key target poke; brief **charge-safe step** after hit.
* **Bladeform (Edge Stance):** armor-piercing, single-target finish vs **Marked**; precision only.
* **Hammerform (Impact Stance):** short cone **stagger/sunder** to stop enemy momentum.

**Actives/Auras:**

* **Sever the Loom (active):** bonus finish vs **Marked** → then **Grounding Step** back along a Node.
* **Exploit Order (target ally):** next action gains discipline/accuracy **only vs Marked**.
* **Bedrock Command (aura):** reduced self-penalties; leadership steady inside Node rings.

**TWW mantra:** **EARTH → Establish node • Apply marks • Rally hitter • Trigger cut • Head out.**

---

## Lens 3 - **Into the Breach** (deterministic micro)

**Loadout:**

* **Stone Cut (Primary):** *Push 1; if target is Marked, deal clean dmg too.*
* **Flag Harness (Secondary):** your **next action is undo-able**.
* **Terraced Crown (Passive):** pushes can't harm allies; leaving a Node grants stability.

**ITB mantra:** **SLAB → Stand on node • Line-preview • Act once • Bounce if wrong.**

---

## Dev-workflow mapping (how you "play" him)

1. **Weave-ready check (MOUNT).**
2. **Pick threadform:**

   * **Spear** → *Route flip* (feature flag / path swap across a clean lane).
   * **Blade** → *Precision cut* (one threshold/clamp line).
   * **Hammer** → *Stabilizer* (debounce/hysteresis/aggregation).
3. **Define metric bound** (one pass/fail).
4. **Apply** the tiny change **behind a flag**.
5. **Measure →** if fail, **rollback**; if pass, **Grounding Step** (exit clean, log SRL).

**Say it aloud:** *"Ground first, cut second. One strike, one bound, one undo."*

---

## Image prompt (for your roster sheet)

> **Subject:** **Thread Sovereign**, a colossal **mountain woven from luminous threads**, wearing the **Crown of Loomstone**. Black-basalt plates with glowing seam-runes; calm, immovable stance. He wields a **transforming thread-weapon** mid-morph between **spear, blade, and hammer**; thin lanes of thread radiate as a map of possibilities. A faint **node-ring** glows beneath his feet like a sigil. **Mood:** decisive, grounded, shielded. **Style:** techno-mythic hive, rim-light, shallow DOF, ultra-detailed, no text/watermark.


Yes-let's reforge **Faultline Seeker** around your image: a **lithe scout** whose cloak **shatters into tiny swarmlings**, each a safe probe. The Seeker carries a **lanthorn**-a living scanner whose light reveals hairline fractures in the weave. Fire = the *signal flare*, not destruction.

---

# Faultline Seeker - **Fire • Rogue • Explore**

**Theme:** *Lanthorn & Swarm*

## Visual core (to summon the mindset)

* **Silhouette:** lean, low stance; cloak of **ember-threads** that can **shed into swarmlings**.
* **Tool:** the **Lanthorn**-a focused light that scans threads; faults glow **crimson-vein**.
* **Action:** raise lanthorn → fractures reveal → cloak bursts into **micro-probes** → they skitter, ping, and return → cloak reforms.

**Prime rule:** **Do no harm; prove or disprove.** *(Sandboxed, idempotent, revertible.)*

---

## Kit (metaphor → practice)

### 1) **Lanthorn Scan** - *reveal the faultline*

* **Imagery:** a narrow cone of light that makes hidden cracks fluoresce.
* **Coding move:** one fast **diagnostic read** that never writes: dry-run, static check, log scrape, golden replay.
* **Button in your head:** *"Scan first; don't touch state."*

### 2) **Split the Cloak** - *spawn swarmlings (micro-probes)*

* **Imagery:** cloak atomizes into **3 bright motes**; each darts to a different seam.
* **Coding move:** run **1-3** tiny, parallel probes-each with seed, timebox, explicit **abort**.
* **Safety:** every swarmling is **idempotent** (safe to run twice) and **namespaced** (can't leak to prod).

### 3) **Recall & Fuse** - *stop on signal, merge with evidence*

* **Imagery:** motes return; the cloak reweaves; the lanthorn brightens or dims.
* **Coding move:** **stop on first true signal** or at timeout; emit a **minimal repro** + **SRL** (Snapshot→Result→Lesson).
* **Handoff:** *signal* → Sovereign (Exploit); *no signal* → Prism (A/B).

### 4) **Veil Step** - *vanish cleanly*

* **Imagery:** glow fades; threads tuck back in.
* **Coding move:** **cleanup hooks** run; flags and temp counters off; sandbox torn down.

---

## Mnemonics (say them out loud)

* **LANTERN** - *Locate assumption • Aim scan • Null-harm sandbox • Timebox • Evidence • Recall • Next step*
* **SWARM** - *Seeds • Workers(≤3) • Abort rule • Reports • Merge*
* **HEAT** - *Hypothesis • Experiments(1-3) • Abort rule • Timebox*
* **Kill-switch mantra:** **"Heat ≥ bound → stop; else → next spark or handoff."**

---

## Guardrails (baked in)

* **Isolation:** probes run in a **sandbox namespace** or behind a **feature flag**.
* **Determinism:** every swarmling declares **seed** and **fixed clock**; replays are repeatable.
* **Small surface:** probes touch **harness** code or **read-only** ports-*not* product logic.
* **One metric:** each probe owns exactly **one** success signal.
* **Budget:** total **≤ 20 min** or **≤ N iterations**; abort on safety trip (write, RSS spike, unhandled error).

---

## Tiny, copy-paste scaffolds

### Probe set (YAML you can drop in a repo)

```yaml
hypothesis: "Low-light causes hysteresis oscillation near threshold."
probes:
  - name: lanthorn-edge
    seed: "clip_lowlight_A"
    mode: "edge_ping"
    expect: "oscillation_flag==true"
    timebox_min: 8
    safety: {rss_mb_max: 200, writes_allowed: false}
  - name: lanthorn-fuzz
    seed: "clip_lowlight_A"
    mode: "fuzz_heat"
    params: {brightness_jitter_pct: 5}
    expect: "false_double_rate >= 2x_control"
    timebox_min: 8
stop:
  on_signal: true         # first true hit stops the pack
  timeout_min: 20
artifacts:
  - "reports/lanthorn_edge.json"
  - "reports/lanthorn_fuzz.json"
  - "seeds/lowlight_A.json"
next:
  on_signal: "handoff: Thread Sovereign (Bladeform clamp)"
  on_empty:  "handoff: Prism Magus (TTC A/B flag)"
```

### Orchestrator pseudocode (the cloak splitting)

```python
def seeker_run(board, probes):
    assert sandbox_ready() and writes_blocked()
    results = []
    for p in parallel_limit(probes, max_workers=3):
        r = run_probe(p)           # idempotent, seeded, timeboxed
        results.append(r)
        if r.signal: break         # stop on first heat
    evidence = collect_artifacts(results)
    srl = write_srl(snapshot=board['problem'],
                    result=signal_summary(results),
                    lesson=single_sentence(results))
    return decide_handoff(results, srl)
```

---

## Example probes (ready names you can reuse)

* **lanthorn-edge:** push just over/under a threshold; expect a flag, not a fix.
* **lanthorn-fuzz:** bounded jitter; expect invariant holds or a clear break.
* **lanthorn-replay:** golden trace with one variable nudged; expect delta in one metric.
* **lanthorn-ablate:** switch one module off in sandbox; expect symptom to fade or persist.
* **lanthorn-load:** minimal burst that imitates real pressure (never ramps beyond cap).

---

## Interplay (so the swarm helps the others)

* **→ Thread Sovereign:** deliver **one minimal repro** plus **exact clamp suggestion** (e.g., "set threshold 0.55 on class *lowlight* only").
* **→ Prism Magus:** deliver **evidence that B may win** (e.g., "TTC predicts earlier by 30% on seeds A/B without false-ups").
* **← Web Cartographer:** request a **Node lane** (instrumentation path or stable harness) before you probe so you can exit cleanly.
* **↔ Silk Scribe:** you produce **SRL lines**; Scribe rolls them up by horizon.

---

## Anti-patterns to catch

* **Soot, no light:** you changed state but learned nothing → revert and re-isolate.
* **Crowd fire:** >3 swarmlings at once → noise; trim to the best 1-3.
* **Wandering lantern:** scanning without a named assumption → write **HYP:** first.
* **Ghost seeds:** no seed or timestamp → non-reproducible; treat as a miss.

---

## Image prompt (for your roster sheet)

> **Subject:** **Faultline Seeker**, a lithe rogue whose **cloak splits into glowing swarmlings**. In one hand, a **lanthorn scanner** casts a sharp cone of light; hairline **cracks fluoresce** crimson along nearby threads. The swarmlings race along the lit seams, each leaving a tiny glyph. **Mood:** fast, precise, non-destructive. **Style:** dark techno-mythic hive; rim light; shallow DOF; ultra-detailed; no text/watermark.

---

### Pocket calls

* **"LANTERN live."**
* **"Three swarmlings max."**
* **"Seed or it didn't happen."**
* **"No heat, no cut."**

If you want, I can turn this into a `SEEKER_CHECKLIST.md` and a minimal probe runner (Node/Python) that spawns "swarmlings" with timeboxes and writes SRL lines automatically.


Absolutely-here's **Faultline Seeker** reframed through the four lenses you asked for, all aligned to your theme: **Fire • Rogue • EXPLORE** with the **Lanthorn & Swarm** motif (lithe scout, scanning light, cloak that splits into swarmlings). Each lens ends with a tight **dev translation** so the mindset directly improves coding and decisions.

---

# Faultline Seeker - Game Lenses

**Element:** Fire **Archetype:** Rogue **Keyword:** Explore
**Image:** a sleek figure whose cloak bursts into **swarmlings** while a **lanthorn** scans threads; fractures glow crimson.

**Core mnemonics**

* **LANTERN** - *Locate assumption • Aim scan • Null-harm sandbox • Timebox • Evidence • Recall • Next*
* **SWARM** - *Seeds • Workers(≤3) • Abort rule • Reports • Merge*
* **HEAT** - *Hypothesis • Experiments(1-3) • Abort rule • Timebox*

---

## 1) MTG Lens - **UR Tempo-Probe (Red/Blue)**

**Color identity:** **R/U** - Red = fast sparks & tempo pushes; Blue = inquiry, scry, and restraint.
**Deck archetype:** **Spells-tempo** that converts small cantrips into **actionable information**.

**Legendary vibe (original, numbers-free):**

* **Lanthorn Scan -** *Scry/Surveil 1; Investigate.* (peek safely + produce a probe token/log)
* **Split the Cloak -** *Create up to three 0/1 **Probe** artifact creatures with "Sacrifice: look deeper or fork the test."*
* **Stop on Signal -** *If a spell you cast would whiff, you may return it to hand instead* (reversibility).

**Play pattern:** cheap spell → scan → release 1-3 probes → **stop on first real hit** → hand off the window to your finisher.
**Sideboard mindset:** versus speed, pack more instant-speed scans; versus grind, add repeatable Investigate (longer observation).

**Dev translation**

* **Mana** = time/complexity budget; **curve** = how heavy a probe is.
* Maximize **card advantage = information per minute** (logs/graphs > gut feel).
* Treat each probe as a **cantrip** that either reveals a line or replaces itself with a better next step.

---

## 2) Total War: Warhammer Lens - **Ember Scout / Hex Rogue**

**Battlefield role:** **Vanguard hex-scout** that tags threats, gathers line-of-sight, and **never trades health for info**.

**Buttons (concept names):**

* **Lanthorn Mark (active):** long-range **Mark** (brief hex; stacks to 2) that lowers nerve/poise and reveals position.
* **Split the Cloak (active):** spawn **3 swarmlings** to tag lanes, extend sight, and apply **soft slows** on confirm.
* **Smoke Veil (active):** escape/stealth after tagging.
* **Fault Sense (passive):** detects hidden units near stressed terrain or captured lanes.

**Micro:** vanguard → **Mark** priority → **split cloak** → peel back with **Smoke Veil**; repeat until a double-Mark appears for your finisher.

**Dev translation**

* "Vanguard" = run probes **first** on a safe replica path.
* **LoS** = visibility into metrics/logs before you commit.
* Your KPI is **survival of the scout**: if the probe risks prod, you misplayed the lens.

---

## 3) Into the Breach Lens - **Predictive Trapper**

**Squad slot:** positional **setup unit** that turns knowledge into safer future turns.

**Kit (concept):**

* **Faultlight (Primary):** reveal & **Mark** an enemy; preview its next line.
* **Swarmlings (Secondary):** deploy **up to 3 drones** that ping when a foe crosses a seam; each can nudge (1 tile) or confirm a hazard.
* **Stop on Signal (Passive):** once per turn, recalling a drone grants a free preview/undo of your last placement.

**Micro:** preview → place drones along likely lines → **abort on red** → leave the board **safer next turn**.

**Dev translation**

* Use **preview tools** (static checks, dry-runs) before touching live paths.
* Drones = **parallel micro-tests**; only 1-3 at a time; recall on first hit.
* You measure **threat deflection**, not damage (e.g., fewer regressions, earlier detection).

---

## 4) 40k Lens - **Faultline Seeker (Obsidiam Unit)**

> *Numbers-free, modern datasheet style; original wording only.*

**Faction Keywords:** XENOS, HIVE FLEET, **OBSIDIAM**
**Unit Keywords:** INFANTRY, CHARACTER, **FAULTLINE SEEKER**, SCOUT, LONE OPERATIVE (short), DEEP STRIKE

**Role:** **Skirmisher/Tagger - Fire • Rogue • Explore**

**Wargear theme:** **Lanthorn Scanner** (projective light), **Spark-Darts** (non-lethal tags), **Cloak of Swarmlings** (deployable probes).

**Abilities (core):**

* **Lanthorn Scan (Action):** at end of your Movement, **Mark** a visible enemy (temporary token; clears on your next turn).
* **Split the Cloak:** when you perform **Scan**, you may place up to **3 **Swarmling** tokens** wholly within short range; each grants **Line-of-Sight relay** and forces enemies within a small radius to take **discipline checks** at a slight penalty. Remove all Swarmlings at the start of your next Command phase.
* **Stop on Signal:** if a **Marked** enemy fails a Battle-shock or is destroyed this round, you can **Normal Move** the Seeker (short) or **remove** one Swarmling to place a new one within the original radius.

**Detachment synergy (Web of Decisions):**

* Counts as **Explore** seat: creates Marks safely and sets windows for **Exploit** units.
* Loves **Golden Trace** (Tag+Node on loss) and **Contract-Net** (tempo chaining after a Confirmed Mark).

**Stratagem (1CP, Battle Tactic) - "Flare & Fade":**

* Use after this unit performs **Scan**: it **becomes Stealthy** and can make a **Consolidation move** even if it didn't fight (once/phase).

**Battlefield use:** vanguard scout; tag a priority threat; seed Swarmlings to keep sight and pressure; never overstay-**set the table** for the Sovereign/Warriors.

**Dev translation**

* **Scan** = **read-only diagnostic** (dry-run, log scrape, replay).
* **Swarmlings** = **seeded parallel tests** with explicit teardown.
* **Flare & Fade** = perform a probe then immediately **reduce blast radius** (clean up hooks, disable flags).

---

## Quick chooser (which lens to think with)

* **Need a *values* check (is this even wise?) →** MTG.
* **Need *position & timing* (who moves first?) →** Total War.
* **Need *exact causality* (what happens if?) →** Into the Breach.
* **Need *table cadence with tokens/roles* →** 40k.

---

## Pocket calls (tie back to coding)

* **"LANTERN live-no heat, no cut."**
* **"Three swarmlings max; seed or it didn't happen."**
* **"Tag for others, don't chase the kill."**

If you want, I can format this into a clean **two-page sheet** and then repeat the same four-lens treatment for your next champion-or jump to the **MTG** and **Pokémon TCG** views for the whole faction next.



Love the refinement. **Prism Magus** isn't just A/B - it's a **fan of viable alternatives** that bend light and water across time and constraints, then curates the **best few** to present. Below is a tight multi-lens sheet (MTG · TWW · Into the Breach · 40k) plus a coding playbook so the mindset improves real decisions.

---

# Prism Magus - **Light×Water • Magician • PIVOT (Alternatives)**

*Threads of state-action space refract like light on water; many channels, one destination.*

## Essence

* **Job:** Generate **several safe alternatives**, **reframe** the problem (perspective/constraint/horizon), **pilot the top few**, and recommend **one to adopt now** (and one to keep in reserve).
* **Mantras:**
  **PRISM** - *Pilot • Reframe • In Small • Measure*
  **FAN-PRISM** - *Fan options → Align to goals/horizons → Normalise constraints → Pareto filter → Rank EV → Instrument pilots → Safeguard → Measure*
  **FLOW** - *Fix goal • Limit scope • Option-pilot • Waterline (guardrail)*

## Option types (what "many" looks like)

* **Method swap:** algorithm/tool/library change.
* **Schedule swap:** batch ↔ streaming; eager ↔ lazy.
* **Placement swap:** client/edge ↔ service/cloud.
* **Scope swap:** subset/cohort; progressive rollout.
* **Representation swap:** data shape/precision/units.
* **Perspective pivot:** optimize a **surrogate metric** (strongly correlated).
* **Constraint bend (water rules):** *Soften* (tighter bounds), *Divert* (proxy resource), *Sandbox* (override in test), *Decompose* (split constraints), *Invert* (treat constraint as objective for discovery).
* **Horizon tuning:** near (1h/1d) vs far (1w/1m) acceptance bands.

---

## 1) **MTG lens - UWg "Modal Toolbox Control"** (Light/Order with Adaptation)

**Color identity:** **U/W** core + **G** splash. Blue = knowledge/choice; White = safety/rollback; Green = adaptive channeling.

**Legendary vibe (original):**

* **Prismatic Fan -** *When you cast a small spell, **reveal up to three modes** (A/B/C) from your hand of tactics. **Choose one to resolve**; the others return to your hand.*
* **Horizon Rewrite -** *Until end of turn, treat your next check as if its goal were "near" or "far."*
* **Waterline Clause -** *Your first method swap each turn is **undo-able**.*

**Play pattern:** **tutor or cantrip** to assemble options → **fan 3 modes** → resolve one → keep the rest for later; never lose tempo to failed B/C because the clause bounces them.

**Dev translation:**

* "Hand of modes" = **preset configs/snippets** kept ready.
* "Fan 3" = generate **3 concrete alternatives**; keep rollback on each.
* "Horizon Rewrite" = **compare against the right timescale** (now vs week).

---

## 2) **Total War: Warhammer lens - Hydro-Lux Support (Option Enabler)**

**Role:** **Mode weaver** that **offers** multiple stances and shields the swap.

**Buttons (concept names):**

* **Refraction Fan (target ally):** present **three stances**: **Laminar** (steady), **Turbulent** (mobile burst), **Spiral** (flanking/arc bias). You **pick one** now; can **bank** a second for the next micro-window.
* **Ripple Veil:** brief protection when swapping (guardrail).
* **Horizon Call:** temporarily **weight near vs far** objective (hold point now vs set up later).
* **Constraint Bend:** for one action, treat harsh terrain/penalty as **reduced** (strider-like effect); sandboxed.

**Micro:** see tags/lanes → **offer 3** → pick 1 + bank 1 → veil → measure → adopt or flow back.

**Dev translation:**

* Stances = **presets** (accuracy, speed, flank bias).
* Banked stance = **ready fallback** if the fight turns.
* Horizon Call = choose **short-term vs long-term** target for this pilot.

---

## 3) **Into the Breach lens - Optic-Tide Controller (Fan-out Preview)**

**Slot:** deterministic **planner** that previews several lines, then commits cleanly.

**Kit (concept):**

* **Fan-out Preview (Primary):** spawn **three ghost lines** (A/B/C) for the same goal; shows pushes/damage before lock-in.
* **Pareto Filter (Secondary):** auto-prune any line that causes collateral or strictly underperforms.
* **Backflow (Passive):** first committed swap each turn is **undo-able**.

**Micro:** preview A/B/C → Pareto leaves the **nondominated** few → commit 1; if red, backflow to A.

**Dev translation:**

* Ghost lines = **dry-runs/shadow invocations**.
* Pareto = keep lines that are **not dominated** on (impact, risk, cost, latency).
* Backflow = **automatic revert** if a guardrail trips.

---

## 4) **40k lens - Prism Magus of the Lumenflow** (original, numbers-free)

**Faction Keywords:** XENOS, HIVE FLEET, **OBSIDIAM**
**Unit Keywords:** INFANTRY, CHARACTER, **PRISM MAGUS**, PSYKER, SUPPORT

**Role:** **Alternative-caster** - presents **viable methods**, alters horizons/constraints within safe rites, and **selects** the top choice.

**Wargear theme:** **Liquid-Prism Mask**, **Refraction Gauntlet**, **Aqua-Lens** (records outcomes)

**Abilities:**

* **Prismatic Fan (Select up to 3 Patterns):** at the start of your phase, **reveal three Patterns** (e.g., Laminar, Turbulent, Spiral). **Choose one to apply now**; you may **Bank** one to apply at the end of this phase if conditions are met.
* **Horizon Scry:** once/round, treat a friendly objective as **Near** (pressure now) or **Far** (set-up) for one check.
* **Constraint Bend (Ritual):** for one friendly unit's next action, **relax a single penalty** (terrain/reload/turn radius) within safe bounds; any harmful outcome is **negated and reverted** (counts as used).

**Detachment fit:** arrives after **Faultline Seeker**; tees up **Thread Sovereign** with the **best channel**; plays perfectly with **Feature Flag** & **Council Turn**.

---

## Coding & decision-making playbook (how to *be* Prism Magus)

**FAN-PRISM in practice (compact):**

1. **Fan options (3-5)** using the **Option Types** list above.
2. **Align** each to **Goal & Horizons** (1h/1d/1w/1m).
3. **Normalise constraints**-pick a **bend** (Soften/Divert/Sandbox/Decompose/Invert) or leave strict.
4. **Pareto filter**-drop dominated lines.
5. **Rank EV** = *(impact×confidence) − (risk+cost)* with **horizon weights**.
6. **Instrument pilots** for the **top 1-2** (fixed seed, same inputs).
7. **Safeguard**-guardrail & exact rollback.
8. **Measure**-adopt winner; bank runner-up; Scribe SRL.

**Pseudocode (drop-in planner skeleton):**

```python
def prism_plan(board, candidates):
    opts = generate_options(board, candidates, n=5)   # method/schedule/placement/scope/representation/perspective
    for o in opts: 
        o.horizon = choose_horizon(board.horizons)    # near vs far
        o.constraint = bend_constraint(o.constraint)  # or keep strict
        o.ev = score(o, weights={"impact":.4,"conf":.3,"risk":.2,"cost":.1})
    front = pareto(opts)                               # drop dominated
    top = rank(front)[:2]                              # shortlist
    pilots = [instrument(o) for o in top]              # flags, seeds, guardrails
    return pilots, select_winner_after_measure(pilots)
```

**Commit tags:**

* `[PLAN] Prism: fan(A/B/C), horizon=<near|far>, bend=<type>, bounds=<rule>`
* `[PILOT] Prism: chosen=<B>, seed=<id>, rollback=<path>`
* `[KEEP] Prism: <B> wins (Δ=<reason>)` / `[BANK] Runner-up=<C>` / `[REVERT] <B> lost; restore <A>]`

**Anti-patterns:** only offering A/B; testing on moving inputs; shipping multiple winners; pivoting without rollback; bending constraints globally instead of **scoped** pilots.

---

## Image prompt (for your sheet)

> **Subject:** **Prism Magus**, a calm figure in a **liquid-prism mask**. From one palm fans **three streams of light-water** (A/B/C), each tracing different thread-lanes; the other palm gathers them into a bright **chosen channel**. Ripples on a dark pool reflect hex motifs and node rings. **Mood:** serene, option-rich, reversible. **Style:** techno-mythic, rim-lit, shallow DOF, ultra-detailed, no text/watermark.

If this matches your vision, I'll mirror the same *multi-option, curate-and-pilot* treatment for **Web Cartographer** next-or package Thread Sovereign, Faultline Seeker, and Prism Magus into a printable codex trio.



Absolutely-here's **Web Cartographer** tuned to your brief:

**AIR • SAGE • REORIENT**
*Zoom out like air; see the whole web; adopt proven patterns; fork the right path instead of starting from scratch.*

---

# Web Cartographer - multi-lens sheet (MTG · TWW · Into the Breach · 40k)

## Essence

* **Image:** a calm **air-sage** hovering above a luminous web; thin jet-streams trace **lanes** between **waystones** (nodes).
* **Core:** **zoom out → map → pick a proven pattern → drop one waypoint step.**
* **Mantras:**
  **AIR** - *Ascend • Index patterns • Recommend route*
  **MAPS** - *Model board • Anchor nodes • Patternize • Step once*
  **LOD** - *Level-of-detail: Near (1h/1d) • Mid (1w) • Far (1m)*

**Gate rule:** **No invention before inspection.** (Adopt > adapt > invent.)

---

## 1) MTG lens - **UW(g) "Cartography Control"** (Light/Order + Adaptation)

**Color identity:** **U/W** core (knowledge/order), splash **G** (growth/adaptation).
**Deck archetype:** **Toolbox/Enchantments**-establish **Maps** (persistent auras), **tutor** a **Pattern**, then **copy route**.

**Legendary vibe (numbers-free, original):**

* **Cartographer's Survey -** *Search your library or sideboard for a **Pattern** (template/standard); reveal it; pick one to prepare.*
* **Waystone Map -** *Create a persistent **Map** that gives lanes (easier lines for allies on that path).*
* **Copy the Route -** *Fork a known Pattern with a tiny adaptation; if it conflicts with constraints, **bounce** (revert).*

**Play pattern:** Map → Survey → Copy Route (tiny fork) → keep Map up as team aura.
**Dev translation:**

* **Map = doc/enforcement layer** (lint rules, ADR, scaffolds).
* **Survey = research pass** (RFCs, libs, internal examples).
* **Copy Route = fork/adopt** with the **smallest viable delta**.

**Mnemonic:** **AIR**-*Ascend (survey), Index (map hubs/holes), Recommend (pattern+step).*

---

## 2) Total War: Warhammer lens - **Aerial Sage / Waystone Engineer**

**Role:** **Reorienter**-shapes terrain of play; makes your army's moves easier and safer.

**Buttons (concept names):**

* **Aerial Recon:** reveal terrain lanes, capture routes, and enemy lines (soft map ping).
* **Lay Waystone (active):** plant a **totem node** that grants pathing/discipline aura and marks the **safe lane**.
* **Adopt Pattern:** grant an ally a **proven formation** (column, brace, skirmish template) for its next action.
* **Wind Call (once/phase):** shift **objective weighting** Near↔Far (hold now vs set up later).

**Micro:** recon → **Waystone** on the live lane → tell one ally to **Adopt Pattern** → everyone routes around the node.
**Dev translation:**

* Waystone = **anchor doc or code scaffold** placed first.
* Adopt Pattern = apply **known formation/preset** (template repo).
* Wind Call = choose **near vs far horizon** for this push.

**Mnemonic:** **MAPS**-*Model • Anchor • Patternize • Step once.*

---

## 3) Into the Breach lens - **Wind-Mapper (Deterministic Lane-Setter)**

**Slot:** positional **controller** that prevents damage by **better routing**.

**Kit (concept):**

* **Place Waypoint (Primary):** create a **safe tile**; allies moving through gain stability; enemies are nudged off lethal lines.
* **Jetstream (Secondary):** gently **push/pull** a unit along a mapped lane (re-route without damage).
* **Forecast (Passive):** show next-turn hazards and **suggest** a pattern (tile label).

**Micro:** forecast → drop **Waypoint** → **Jetstream** a key piece to safety → others follow the lane.
**Dev translation:**

* Waypoint = a **first migration step** (adapter, interface, feature gate).
* Jetstream = **ordering change** (pipe/queue, retry order, priority).
* Forecast = **dashboards/graph** of dependencies and risk.

**Mnemonic:** **LOD**-*Near: save this turn; Mid: open lane; Far: strategic pattern.*

---

## 4) 40k lens - **Web Cartographer (Obsidiam Unit)** (original, numbers-free)

**Faction Keywords:** XENOS, HIVE FLEET, **OBSIDIAM**
**Unit Keywords:** INFANTRY, CHARACTER, **WEB CARTOGRAPHER**, SAGE, SUPPORT

**Role:** **Air-sage reorienter**-makes **paths**; imports **proven patterns**.

**Wargear theme:** **Silk Astrolabe**, **Hex-Map Tablet**, **Wind Vanes**

**Abilities:**

* **Map the Threads (Action):** reveal lanes and chokepoints; place a **Waystone** token (counts as a Node).
* **Adopt Proven Pattern:** select a friendly **OBSIDIAM** unit; until end of phase it follows a **known formation** (template stance); conflicts auto-revert (safe clause).
* **Survey & Fork:** once/round, copy an existing friendly tactic into a **lightweight variant** for one unit (numbers-free, reversible).

**Detachment fit:** pairs with **Faultline Seeker** (scans) and **Thread Sovereign** (finishes); multiplies effect of **Feature Flags** and **Council Turn**.

**Battlefield use:** open lanes, steady morale near Waystones, make allies act like the **best-known pattern**, not ad-hoc.

**Dev translation:**

* Map = run your **cartography tool**, draw hubs/orphans/dangling links.
* Waystone = create **starter scaffold** (folder, interface, ADR, lint profile).
* Adopt Pattern = apply **template** for one action (pilot) with **auto-revert** on conflict.

---

## Coding & decision-making playbook

**Reorient loop (90s):**

1. **Ascend:** snapshot **Problem/Metric/Constraint/Horizons**; run a **quick map** (docs/deps/routes).
2. **Index:** list **3 proven patterns** that fit constraints (internal or external).
3. **Recommend:** pick **one** pattern + **one** **Waystone step** (scaffold, adapter, ADR) that others can follow.
4. **Guard:** add a **small rule** (lint/CI check) so the lane persists.
5. **Hand off:** Sovereign cashes on the easier board; Scribe logs.

**Heuristics to prefer Adopt > Adapt > Invent**

* **Adopt** when pattern is **95% fit** and reversible.
* **Adapt** when one boundary tweak lands **>80%** fit quickly.
* **Invent** only if **no dependable pattern** fits and the cost of delay exceeds risk.

**Commit tags:**

* `[MAP] Cartographer: hubs=<...>, orphans=<...>, dangling=<...>`
* `[WAYSTONE] scaffold=<name>, location=<path>, guardrail=<rule>`
* `[ADOPT] pattern=<source/link>, delta=<tiny change>, rollback=<path>`
* `[REORIENT] objective=<near|far>, reason=<why>`

**Anti-patterns:** inventing before surveying, dropping waystones without a **first user**, pattern sprawl (too many), global constraint bends (keep scoped).

---

## Pocket voice lines

* **"No invention before inspection."**
* **"Drop a waystone; the army will follow."**
* **"Adopt first, adapt second, invent last."**

---

## Image prompt (for your roster sheet)

> **Subject:** **Web Cartographer**, a serene **air-sage** hovering over a vast luminous **hex-web**. In one hand, a delicate **silk astrolabe**; in the other, a translucent **hex-map tablet** projecting **waystones** and **jetstream lanes**. Threads arc like wind-trails; hubs glow softly. **Mood:** high vantage, mapping, calmly directive. **Style:** techno-mythic, rim-lit, shallow DOF, ultra-detailed, no text/watermark.

Want me to compress this into a printable **two-page REORIENT sheet** and add a tiny `waystone_scaffold/` template (ADR + lint config + folder skeleton) you can drop into any repo?
