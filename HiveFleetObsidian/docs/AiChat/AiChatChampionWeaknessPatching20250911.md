# HiveFleet Obsidian - One-Page Snapshot (Adopt first, then adapt)

## What you already do well (strengths)

* **Clear roles, no overlap.** Explore (Seeker) → Exploit (Sovereign) → Pivot (Magus) → Reorient (Cartographer) → Record (Scribe) → Route (Orchestrator).
* **Safety by default.** Small test, behind a switch, with an **undo** ready.
* **Compounding wins.** One safe gain at a time adds up fast.
* **Low cognitive load.** Story cards + fixed output shapes = easy to run, easy to read.
* **Parallel-ready.** Small, reversible steps + crisp handoffs make swarms practical.

## Where you struggle (weaknesses)

* **Missing signals stall you.** If metrics / tripwires / a baseline aren't there, work pauses.
* **Tempo matchups.** Fast problems can outrun careful checks unless you have pre-cleared "micro-cuts."
* **Flag/debt drift.** Feature switches that never retire pile up.
* **Learning bottleneck.** You still carry the memory loop; Scribe isn't fully automated.
* **Baseline rot.** Side-by-side (shadow) comparisons get stale if not refreshed.

## Do these next (ADOPT - small, proven upgrades)

1. **Minimum Telemetry Pack** (Cartographer + Sovereign + Scribe)

   * **What:** For every change require: one **guard metric**, one **tripwire**, one **golden test**.
   * **Why:** Deletes "no-signal" stalls.

2. **Flag + Canary Shell** (Sovereign)

   * **What:** Tiny template: **feature flag**, **1% rollout**, **auto-rollback** command.
   * **Why:** Turns risk into a switch.

3. **Fast Shadow Harness** (Sovereign)

   * **What:** Side-by-side run vs baseline on a small slice; emit a simple **diff report**.
   * **Why:** Catch drift before full rollout.

4. **Pilot Pack Library** (Magus)

   * **What:** Two **reversible** starter options per common goal (folder + flag + undo).
   * **Why:** Cuts time to first test.

5. **Probe Budget List** (Seeker)

   * **What:** "Top 3 cheap probes" per domain (e.g., uploads, auth).
   * **Why:** Start fast, avoid overthinking.

6. **Dual-Write Scribe** (Scribe)

   * **What:** Append each result to **two stores** (repo log + lightweight DB) with a hash.
   * **Why:** Reliable memory, easy cross-check.

7. **Safety-Triad Gate** (Orchestrator)

   * **What:** Refuse routing unless **Metric + Tripwire + Rollback** exist.
   * **Why:** Guards champions from bad inputs.

8. **Pre-cleared "Emergency Micro-Cut"** (Sovereign)

   * **What:** One audited, high-impact change per area you can ship fast, with instant undo.
   * **Why:** Solves tempo races.

9. **Pattern Index (12-20 items max)** (Cartographer)

   * **What:** Short pages for battle-tested solutions: **When to use, Risks, First slice example**.
   * **Why:** "Adopt > Adapt > Invent" becomes automatic.

## Then consider (ADAPT - once the above is in place)

* **Auto-tilt pilot traffic** to the better option (simple probability-based switcher).
* **Post-promotion sentinels** (24h drift watch that can auto-rollback).
* **Weekly flag cleanup** (retire or set expiry).

## Simple operating rules (always on)

* **One change at a time per area.**
* **Switch + small slice + undo** defined before any change.
* **Stop on tripwire.** Roll back first, then investigate.

## Champion reminder (one-liners)

* **Seeker:** "Find a real issue fast with 3 tiny tests."
* **Sovereign:** "Ship one safe change with undo."
* **Magus:** "Offer two reversible ways; pick one."
* **Cartographer:** "Use a proven pattern; take the smallest slice."
* **Scribe:** "Write what happened; schedule the next look."
* **Orchestrator:** "Check safety, pick champion, keep it to 3 steps."

## How to tell it's working (3 simple metrics)

* **Win rate:** % of changes promoted without rollback.
* **Time to first signal:** Idea → first metric seen.
* **Learning rate:** SRL lines per week (with tags).

**Bottom line:** You're already a disciplined, safe, compounding machine. Add the nine **adopt-first** upgrades above and you'll gain speed without losing safety-turning HiveFleet Obsidian from "solid control" into "inevitable."
