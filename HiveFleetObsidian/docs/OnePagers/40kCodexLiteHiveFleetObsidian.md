 Love it. Here's your **2-page, numbers-free "Codex-Lite: Hive Fleet Obsidiam (Mnemonic Edition)"**-built to slot straight into your dev ritual for a **parallel swarm of agents**.

---

# Page 1 - Army Identity, Rules, Detachment & Tactics (mental map)

## Faction Identity

**A quiet control swarm that tags prey and pulls threads.**
You win by **marking targets**, **redirecting lanes**, and taking **one clean, reversible strike** per loop.

## Army Rule - **The Weave Unseen**

Assign each of the four **Seats** to different units at the start of the round:
**E²PR → Exploit · Explore · Pivot · Reorient**

* **Exploit** - *"Cash the tag."* Bonus bite vs **Marked** targets; if no mark, take a tiny reliability bump.
* **Explore** - *"Tag cheaply."* Perform **Probe** to put a **Web Marker** on an enemy.
* **Pivot** - *"Change the angle."* Advance-&-shoot **or** fall-back-&-shoot (no charge).
* **Reorient** - *"Ghost & go."* Stealthier pathing and charge help.

### Tokens (your mental economy)

* **Web Marker (enemy):** *Doubts.* Lowers their nerve; unlocks your spikes. **Max 2** per enemy in your head-canon; they clear next turn.
* **Web Node (ally):** *Discipline.* Friendly anchor that boosts **Objective presence** and smooths movement inside its ring.

## Detachment - **Web of Decisions**

**Rule - Council Turn:** *One swap after assignment.* If the board shifts, **trade Stances** between two units before moving.

### Artifacts (Enhancements → memory hooks)

* **Obsidian Diadem** - *"After-Act Slide."* After a nearby ally acts, it may **step** (no charge).
  **Mnemonic:** **DIADEM = Do-It-Again Movement.**
* **Scribe's Sigil** - *"Paid receipts."* Occasional CP refund when you Strat on bearer's unit.
  **Mnemonic:** **SIGIL = Stratagems Increase Gains In Logistics.**
* **Faultline Scanner** - *"First touch, hard to pin."* Pregame nudge; tough to target in cover.
  **Mnemonic:** **SCAN = Scout, Conceal, Assumption-Needle.**
* **Prismatic Lens** - *"Mode flip."* Once per turn, flip a friendly weapon's mode (**stable** vs **mobile**).
  **Mnemonic:** **LENS = Lock/Enable New Style.**

### Stratagems (6 quick plays → when to press them)

* **Thread the Needle** - *Spike vs Marked.* Use when the tag is live and you need conversion **now**.
* **Rollback Protocol** - *Do-over at a cost.* Undo a shot and retarget with a slight handicap. (Ship small, reversible.)
* **Feature Flag** - *Dual-stance.* Let one unit count as **Exploit** in addition to its seat.
* **Golden Trace** - *Revenge mark + free node* when you lose a unit. (Learn + position.)
* **Contract-Net** - *Chain fire.* Kill → nearby ally immediately shoots. (Tempo only once per phase.)
* **Stigmergic Trails** - *Drop Node, count stationary.* Plant discipline then act like you held fast.

---

## Turn Script (battle-tested dev loop)

**Gate → Board → Seats → Tags → Nodes → Exploit → Swap (if needed) → Log**

* **Gate/Board:** Problem · Metric · Constraint · Horizons (1h/1d/1w/1m).
* **Seats:** *Explore* seeds marks; *Reorient* lays lanes; *Pivot* picks mode; *Exploit* cashes.
* **Swap:** If a surprise lands, use **Council Turn** to re-thread.
* **Log:** **Scribe** writes *Snapshot → Result → Lesson* (SRL).

**Two opening "book" lines**

1. **Tag-and-Pin:** Seeker marks → Cartographer plants Node → Warriors shoot → Sovereign finishes.
2. **Ghost-A/B:** Cartographer ghosts path → Prism flips mode → light probe → Sovereign ships the tiny, guarded cut.

---

# Page 2 - Champions as Units (playstyle + mnemonics + dev translation)

> **Format per unit:** *Identity • How to use • Tradeoffs • Mnemonic & Mantra • Dev translation*

### **TTao, Lord of Strings** - *Supreme controller / stance conductor*

* **Use:** Set seats; fix targeting; bail a key piece once per game with a safe reposition.
* **Tradeoffs:** Central, must be screened; power is timing.
* **Mnemonic:** **CALM = Choose, Assign, Landscape, Move.**
* **Mantra:** *Weave quietly; strike once.*
* **Dev:** You orchestrate: allocate agents, change one plan mid-loop, protect momentum.

---

### **Thread Sovereign** (Seat: **Exploit**) - *Ruler / closer*

* **Use:** Cash **Marked** targets; pick **one safe, reversible step** that moves the metric **today**.
* **Tradeoffs:** Needs tag economy; average without support.
* **Mnemonic:** **SSS = Small • Safe • Scorable.**
* **Mantra:** *One cut you can undo.*
* **Dev:** Ship a guarded change behind a flag; pass a smoke; define exact rollback.

### **Faultline Seeker** (Seat: **Explore**) - *Scout / tagger*

* **Use:** Generate **Web Markers** early; run **1-3 micro-tests** with stop rules.
* **Tradeoffs:** Fragile; lives on terrain and timeboxes.
* **Mnemonic:** **FAST = Falsify Assumption with Small Tests.**
* **Mantra:** *Signal ends the search.*
* **Dev:** Record a quick repro; replay golden; stop at first real signal.

### **Prism Magus** (Seat: **Pivot**) - *Reframer / A/B pilot*

* **Use:** Keep the goal, switch method; grant a mode (**volume vs mobility**) to the right ally.
* **Tradeoffs:** Proximity; doesn't brawl.
* **Mnemonic:** **PRISM = Pilot Reframe In Small Measure.**
* **Mantra:** *Same aim, easier route.*
* **Dev:** Run a tiny A/B behind a flag; keep only the winner.

### **Web Cartographer** (Seat: **Reorient**) - *Field engineer / lane maker*

* **Use:** Place **Web Nodes**; smooth charges and holds; publish a pattern + smallest first step.
* **Tradeoffs:** Low damage; protect to keep lanes.
* **Mnemonic:** **MAP = Model • Anchor • Path.**
* **Mantra:** *Lines before leaps.*
* **Dev:** Adopt a proven pattern; lay one guard rail; make the next step obvious.

---

### **Lattice Steward** (Always-on) - *Stability / guardrails*

* **Use:** Add exactly **one** guardrail per loop (debounce, plausibility, ordering).
* **Tradeoffs:** Micro-latency budget; don't stack three at once.
* **Mnemonic:** **HALT = Hygiene • Anti-wobble • Latency • Tripwire.**
* **Dev:** Add debounce/hysteresis; clamp teleporters; introduce a fail-shut.

### **Silk Scribe** (Always-on) - *Memory / CP economy*

* **Use:** Note **SRL: Snapshot → Result → Lesson**; occasionally refunds when you play smart.
* **Tradeoffs:** Zero damage; must survive.
* **Mnemonic:** **SRL = See • Result • Learn.**
* **Dev:** Append to `history.jsonl` each loop; mine keywords weekly.

---

## Extended Bench (call as bottlenecks appear)

* **Honeycomb Smith** - *Scaffold maker*
  **Mnemonic:** **FRAME = Fit • Reduce • Adapt • Minimal • Expose.**
  **Dev:** Build the tiniest adapter + one test, nothing more.

* **Window Hunter** - *Finisher on a clock*
  **Mnemonic:** **DOOR = Deadly Opening • One Riposte.**
  **Dev:** When a window appears, ship the pre-blessed cut; rollback ready.

* **Safebreaker** - *Rule unlock in sandbox*
  **Mnemonic:** **SAFE = Sandbox • Audit • Flip • Exit.**
  **Dev:** Change the blocking rule only in a safe cell; exit if harm appears.

* **First Principles** - *Reset to simple*
  **Mnemonic:** **ONE = One goal • Next step • Expose assumption.**
  **Dev:** Write one sentence, one step, one hidden belief-then move.

* **Swarm Jester** - *Unstuck via variety*
  **Mnemonic:** **3V = Three Variations • Vote.**
  **Dev:** Produce A/B/C cheap variants; score; keep the winner.

* **Concord Weaver** - *Adoption & feel*
  **Mnemonic:** **FEEL = Fit • Ergonomics • Empathy • Language.**
  **Dev:** Rename, default, and flow so the easy path feels right.

* **Signal Warden** - *Safety defaults*
  **Mnemonic:** **PACT = Privacy • Autonomy • Consent • Tolerances.**
  **Dev:** Ship with safe toggles; log consent; enforce bounds.

* **Shadow Auditor** - *Rare red-team*
  **Mnemonic:** **DARK = Degrade • Attack • Reward-hacks • Kill-switch.**
  **Dev:** Probe worst-case incentives; verify brakes.

---

## Quick pocket cards (use these out loud)

* **Seats call:** "**Seeker** tag → **Cartographer** node → **Prism** mode → **Sovereign** cut."
* **When stuck:** **ONE**, **3V**, or **SAFE**, then **SSS**.
* **Always:** **HALT** once, **SRL** always.
* **Thread economy:** **Markers make knives; Nodes make kings.**

Want this as a printable two-page PDF or a pocket **cheat-sheet card deck**? Say the word and I'll export it.
