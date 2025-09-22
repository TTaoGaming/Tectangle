---
id: ww-2025-074
owner: @TTaoGaming
status: active
expires_on: 2025-10-10
guard: hex:tier:commit must pass sdk_facade.contract tests for on(type,handler) & on(handler)
flag: FEATURE_SDK_ON_TYPED
revert: remove folder/flag
---

# Webway: HexInput.on typed contract

Goal: Support `on(type, handler)` while preserving `on(handler)`; ensure Dino and others receive typed pinch events.
Proven path: Align with Node/EventEmitter-style signatures; add unit coverage in `sdk_facade.contract.test.mjs`.
Files touched: `src/sdk/hexInputFacade.js`, `tests/unit/sdk/sdk_facade.contract.test.mjs`.
Markers: WEBWAY:ww-2025-074:
Next steps:

- Implement overload dispatch that records per-type handlers.
- Update facade emitters to call typed handlers.
- Add tests: both overloads invoked; wrong type does not fire; unsub works.
- Implement overload dispatch that records per-type handlers.
- Update facade emitters to call typed handlers.
- Add tests: both overloads invoked; wrong type does not fire; unsub works.
