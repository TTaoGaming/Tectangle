<!-- Updated: 2025-09-18T13:32:25.878Z -->
# Web Cartographer - Future Ideas & Working Agreement
_Last updated: 2025-09-15 • Status: Draft_

## TL;DR
- **Mission**: Reuse proven examples first. Output a **Webway** = a proven path + the smallest scaffold that works (note + markers + guard + flag + revert).  
- **Now**: Web Cartographer *may* propose tiny diffs.  
- **Later**: Map-only; another role applies changes.  
- **Mnemonic (SAW)**: **Scan** the repo → consult the **Atlas** (precedents) → produce a **Webway** (scaffold).

---

## North Star
- **Adopt-first**: avoid rewrites.
- **Reversible by default**: feature flags + clear revert.
- **Provenance**: every inference and change is traceable (note + markers).
- **Low cognitive load**: ≤150 words before code blocks; plain language.

---

## What is a Webway?
**Definition**: A small, traceable path to value using a precedent, plus a minimal scaffold so it works now.

**Artifacts**
- **Note (.md)** at `scaffolds/webway_<slug>.md` with YAML front-matter (ID, owner, expires_on (TTL), guard, flag, revert).
- **Inline markers** in code: single-line comments `WEBWAY:<id>:` at the smallest changed unit.
- **Guard** (test/check) + **Flag** (feature toggle).
- **Revert** instructions (remove folder/flag).

**Auto-expire (TTL)**: default 21 days. On expiry: renew, cut, or remove.

---

## Operating Mode (now → later)
### v1 - Solo (today)
- Use Copilot Chat Mode **Web Cartographer**.
- May propose a minimal unified diff (behind a flag, passing the guard).
- Always create the Webway note + markers.

### v2 - Two-Step (near term)
- Web Cartographer: emits **Webway** (note + markers), *no code edits*.
- Executor role (e.g., Thread Sovereign): applies the change under the flag and satisfies the guard.

### v3 - Crew (future)
- Multi-agent orchestration: Cartographer maps; executor(s) cut guarded changes; Scribe rolls up outcomes.

---

## Best-Practice Playbook (stigmergy)
1) **Webway Notes with TTL (start here)**
   - One note per Webway, ≤150 words + YAML header.
   - CI job blocks expired notes.
2) **Inline Markers**
   - One line, easy to grep; keep 1 ID ↔ 1 note.
3) **Discussion Thread (optional)**
   - Auto-open a GitHub Discussion per Webway for cross-role handoffs.

---

## Repository Conventions
- **IDs**: `ww-YYYY-NNN` (e.g., `ww-2025-001`), unique per repo.  
- **Flags**: `FEATURE_<DOMAIN>_<SHORT>` (e.g., `FEATURE_PWA_PRESETS`).  
- **Guards**: test names or size/perf checks (e.g., `e2e:presets-roundtrip`, `ci:size-limit`).  
- **Labels** (Discussions/Issues): `webway`, plus domain tags `perf`, `pwa`, `auth`, `ml`, `ui`.

**Grep tips**
```sh
rg "WEBWAY:" -n
rg "id:\s*ww-" scaffolds/ -n
