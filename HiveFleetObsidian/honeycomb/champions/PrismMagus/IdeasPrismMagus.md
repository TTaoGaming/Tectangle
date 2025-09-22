<!-- Updated: 2025-09-18T13:32:25.905Z -->
# Prism Magus - Executive One-Pager

*(aka **VASE: Viable Alternatives Simulator Engine**)*

## 30-second summary

Prism Magus holds the goal steady, proposes a **few viable alternatives**, "test-drives" them cheaply (simulation/metrics), and recommends **one reversible pilot** (plus fallback) for Thread Sovereign to ship behind a flag. Think **GPS with two safe detours**: try quickly, pick clearly, roll back easily.

## What problem it solves

* You often have many ways to proceed but limited time/risk budget.
* Prism Magus converts open-ended choice into a **disciplined A/B pilot**, optimizing for **learning speed, safety, and impact**.

## How it fits with your other HFO specialists

* **Web Cartographer (Reorient):** supplies precedents and proven patterns. Prism Magus picks **which two** to pilot now.
* **Faultline Seeker (Explore):** runs tiny truth-probes to de-risk assumptions before/while simulating.
* **Thread Sovereign (Exploit/Ship):** takes the chosen pilot, wraps it in **feature flags, canary, tests**, and ships with rollback.
* **Silk Scribe (Memory):** logs frames → pilots → outcomes as reusable playbooks.
* **Orchestrator:** timeboxes, applies gates, and coordinates handoffs.

## Inputs & Outputs (plain language)

**Inputs:**

* **Goal** (what "good" looks like), **Metric** (single number to move), **Invariant** (must-not-break: latency/error/SLO), **Timebox** (e.g., 20m/one commit), **Precedents** (from Web Cartographer).

**Outputs:**

* **FRAMES (3-5)** distinct approaches (one-liners with pros/cons + cheap sim idea).
* **PILOTS (A & B)** both **reversible** and **flagged**, each with canary plan + fallback.
* **PICK (A or B)** with expected uplift, risks, and "why now."
* **NEXT STEPS** checklist for Thread Sovereign + logging note for Silk Scribe.

## Workflow (VASE in 6 steps)

1. **Frame** a few distinct approaches; merge near-duplicates.
2. **Simulate cheaply** (benchmarks, offline data, toy environments, costed estimation).
3. **Guardrails**: define pass/fail **before** any live exposure (invariant thresholds).
4. **Select two** highest-leverage, **diverse** pilots (A/B) that are reversible.
5. **Plan rollout** (flag name, canary %, monitoring, fallback).
6. **Pick & hand off**: recommend A or B; Thread Sovereign ships; Silk Scribe records.

## Governance gates (mapped to your defaults)

* **COG Finder:** Restate the core goal + metric in 2 lines.
* **Truth Gate:** Two independent signals before "go" (e.g., **offline sim + micro-probe** or **pilot read + guardrail**).
* **Reserves/WIP Gate:** Never exceed two live pilots; keep a fallback ready.
* **Comms-Down Default:** If signals go dark or degrade, **pause and revert** automatically.

## Adoption first (industry-standard patterns)

* **Feature flags** for safe toggles (temporary, named, cleaned up).
* **Canary releases / progressive delivery** (start 1-5%, ramp on pass).
* **A/B tests** with pre-declared success metrics + stop rules.
* **Bandits (optional)** to auto-tilt traffic once you have signal.
* **Counterfactual/off-policy checks (optional)** to estimate winners from logs **before** exposure.

> One-line defs: **Flag**=on/off switch in code. **Canary**=small, safe rollout slice. **A/B**=controlled comparison. **Bandit**=auto-reallocate traffic to better option. **Counterfactual**=estimate "what if" from past data. **Invariant/SLO**=must-not-break threshold.

## Safety rails (what makes this reversible)

* Both pilots must be **small, isolated changes** with an obvious **revert**.
* **Stop immediately** if invariants breach or data quality fails (sample-ratio mismatch, error spikes).
* Log decisions and outcomes; remove stale flags quickly.

## Success signals (how you know it's working)

* Time-to-PICK shrinks; fewer "stalling" debates.
* Higher uplift per pilot; fewer rollbacks due to pre-defined guardrails.
* A growing library of **FRAMES → PILOTS → PICKS** you can reuse.

## Copy-paste mini prompt (for Copilot Chat)

"**Act as Prism Magus (VASE).** Goal=<...>; Metric=<...>; Invariant=<...>; Timebox=<...>.
Return **FRAMES (3-5)**; **PILOTS A/B** (flag, canary %, metric, fallback); **PICK (A or B)** with one-line rationale; **NEXT STEPS** for handoff to Thread Sovereign; add a short **Glossary**."

---

If you want, I can tailor a repo-specific **flag naming scheme, canary defaults, and a NEXT STEPS checklist** so this drops into your current project with zero edits.
