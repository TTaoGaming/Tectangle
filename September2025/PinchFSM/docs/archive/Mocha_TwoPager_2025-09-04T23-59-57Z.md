# Mocha — Executive Two‑Pager

Timestamp: 2025-09-04T23:59:57Z
Location: `September2025/PinchFSM/docs/Mocha_TwoPager_2025-09-04T23-59-57Z.md`

---

## Page 1 — What/Why

- Mocha is a flexible JS test framework; pair with Chai (assertions) and Sinon (mocks). Great for custom setups.
- Pros: modular; simple; fast. Cons: more wiring (chai/sinon/nyc), less batteries‑included than Jest.
- Fit: projects that prefer minimalism, custom reporters, or non‑opinionated configs.

## Page 2 — How it applies here

- Use cases: math/FSM pure tests; streaming replay tests; integration with Node + ESM.
- Minimal stack: mocha + chai + nyc (coverage) + ts‑node/esm if needed.
- Contract:
  - Inputs: replay arrays, configs; Outputs: pass/fail and coverage.
- Quick choice rule: pick Mocha if you want small/light and full control.
- Next step: add a tiny FSM test with chai.expect assertions.
