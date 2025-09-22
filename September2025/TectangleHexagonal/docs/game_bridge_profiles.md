# Game Bridge Macro Profiles (2025-09-16 Draft)

The hexagonal shell can now load pluggable "game profiles" that translate gesture events into high-level game actions. Profiles live in `src/app/gameProfiles/index.js` and can be:

- **Built-ins** – `legacy-primary`, `single-key`, and `seat-multiplex` cover legacy behaviour, quick single-key mappings, and seat-specific buttons.
- **Parametrised** – pass `profile: { use: 'single-key', params: { key: 'KeyZ', keyLabel: 'Z' } }` when creating the shell/game bridge.
- **Custom** – call `registerGameProfile({ id, factory })` before wiring the bridge or provide an inline `{ rules: [...] }` object.

Each profile instance exposes:

- `rules[]` – ordered macro rules with `when` matcher and `emit` payload(s).
- `params` – resolved parameters for telemetry/UI.
- `telemetry` – optional hints (counters/histograms) for downstream recorders.

The bridge emits `type:'action'` envelopes with `profileId`, `profileLabel`, `ruleId`, and optional `payload`. Attach a telemetry sink via `options.gameBridge.telemetry` to accumulate stats (AppShell auto-records counts when `FEATURE_SEAT_TELEM_V1` is enabled).

See `tests/unit/gameEventBridge.test.mjs` and `tests/unit/gameProfiles.registry.test.mjs` for usage patterns.
