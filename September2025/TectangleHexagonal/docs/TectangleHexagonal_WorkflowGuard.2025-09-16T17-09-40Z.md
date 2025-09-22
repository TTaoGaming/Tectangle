<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Validate references against knowledge manifests
- [ ] Log decisions in TODO_2025-09-16.md
-->

# Tectangle Hexagonal Workflow Guardrails - One-Pager
Generated: 2025-09-16T17-09-40Z

Current pulse
- Folders are laid out in hexagonal lanes (`core`, `ports`, `adapters`, `app`), but nothing mechanical stops a stray import from jumping the curb.
- `src/app/main.js` has grown into the town square where UI, ports, and domain logic all mingle; great for demos, risky for discipline.
- Replay tools (`tests/replay/*`) and goldens exist, yet they run only when you remember; Husky and CI do not currently enforce them.
- `faultline/map.json` is empty, so there is no living checklist of intentional boundary exceptions when AI edits start to wander.

Top automation moves
1. **Hex Border Patrol (dependency-cruiser or madge)** - Teach a graph linter the rules: `core` can only depend on `core`, `ports` and `adapters` may touch `core` but never `ui`, etc. Wire it to `npm run hex:lint-arch` and call it in Husky + CI. Think of it as hall monitors checking every import's hall pass before a merge.
2. **Contract snapshots for ports & events** - Wrap the replay scripts into a single `npm run hex:contract` that replays `out/*.landmarks.jsonl`, asserts event shapes, and diffs telemetry schema. Fail fast when a port adds a field without updating docs. That keeps the interface handshake as repeatable as running a flight simulator before every launch.
3. **Composition harness for `app/main`** - Extract a tiny bootstrap (`src/app/bootstrap.js`) that wires cores to ports via dependency injection. Add a headless Jest/Mocha test that feeds fake ports and asserts only the bootstrap touches the DOM. This is your rehearsal stage: the actors (ports/core) stay backstage while the stage manager (bootstrap) calls cues.
4. **Faultline scoreboard** - Populate `faultline/map.json` with known deliberate cross-cutting touchpoints (e.g., why `main.js` talks to MIDI directly). Add a lint script that shouts when commits touch guarded files without updating the map. It becomes a living change log that catches AI context drift the moment it steps outside agreed lanes.

Implementation crumbs
- Add `dependency-cruiser` (or `madge`) dev-dep and drop a config under `September2025/TectangleHexagonal/config/hex-boundary.js`; hook into `.husky/pre-commit` and `.github/workflows/ci.yml`.
- Create `npm run hex:contract` that chains `node tests/replay/validate_analysis.mjs`, `node tests/replay/validate_toi.mjs`, and compares emitted JSON against checked-in expectations with `git diff --exit-code`.
- Carve out `src/app/bootstrap.js` that exports `mountHexApp({ dom, ports })`; refactor `main.js` to call it. Add `tests/unit/bootstrap.pure.test.mjs` with stubbed ports to guarantee no DOM leaks.
- Maintain `faultline/map.json` via a tiny CLI: `node tools/faultline_guard.mjs --expect controllerRouterCore.js` and run it in Husky so new hotspots must be acknowledged.

Signals to watch
- Boundary lint stays green in CI; a red run points to a layer breach you can fix immediately instead of during a release scramble.
- Contract run produces zero JSON diffs; any change means the handshake shifted and docs/tests need the same update.
- Bootstrap test remains pure (no `document` access inside domain code); when it fails, you caught a leakage early.
- Faultline CLI diffs only when you intend to widen the architecture; surprise diffs highlight AI-driven drift while the context is still fresh.
