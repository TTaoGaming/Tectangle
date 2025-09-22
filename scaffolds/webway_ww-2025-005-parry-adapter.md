---
id: ww-2025-005
owner: @Tectangle
status: active
expires_on: 2025-10-07
guard: unit+contract (parry adapter events mapped)
flag: FEATURE_PARRY_ADAPTER
revert: remove folder/flag + delete adapter file + README marker
---
 
# Webway: Parry Sidecar Adapter Integration

Goal: Integrate existing Parry sidecar behavior into the hexagonal architecture as a first-class adapter without destabilizing current pinch pipeline.
Proven path: Sidecar page already exercising desired behavior; adapt pattern similar to prior WEBWAY notes (tiered hooks, hysteresis tube) using feature-flagged port adapter.
Files touched: (planned) src/ports/parry_adapter.mjs, src/app/main.js (flag gate), README.md (marker).
Markers: WEBWAY:ww-2025-005:
Next steps:

- Create `src/ports/parry_adapter.mjs` exposing `init(config, bus)` that subscribes to existing pinch events and emits enriched Parry events (e.g., parry:start, parry:window, parry:success, parry:fail) using deterministic timers derived from core timestamps.
- Add feature flag gate in `src/app/main.js` (check `process.env.FEATURE_PARRY_ADAPTER` or global) and register adapter only when enabled.
- Export telemetry fields (parryWindowMs, parryOutcome) through TelemetryManager envelope extension (non-breaking optional fields).
- Add unit test: simulate pinch down + opposing gesture in time window -> expect parry:success.
- Add contract check: fail if adapter enabled but emits unrecognized sequence (e.g., success without start).
- Revert path validated: removing adapter file + flag leaves original paths unchanged.
