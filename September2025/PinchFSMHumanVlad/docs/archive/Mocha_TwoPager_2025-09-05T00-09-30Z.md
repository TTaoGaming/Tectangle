Mocha — Executive Two‑Pager
===========================

```yaml
title: "Mocha — Executive Two‑Pager"
doc_type: two-pager
timestamp: 2025-09-05T00:09:30Z
tags: [Mocha, testing, chai, sinon]
summary: "Flexible JS test framework; good for custom, lightweight setups."
source_path: "September2025/PinchFSM/docs/two-pagers/Mocha_TwoPager_2025-09-05.md"
```

Timestamp: 2025-09-05T00:09:30Z  
Location: September2025/PinchFSM/docs/two-pagers/Mocha_TwoPager_2025-09-05.md

---

Page 1 — What/Why
-----------------

- Mocha provides a flexible core; pair with Chai (assertions) and Sinon (mocks).
- Pros: modular, simple, fast.
- Cons: more wiring (chai/sinon/nyc), fewer batteries‑included than Jest.

Page 2 — How it applies here
----------------------------

- Use cases: math/FSM unit tests; streaming replay tests; Node + ESM integration.
- Minimal stack: mocha + chai + nyc (coverage) + ts‑node/esm if needed.
- Contract:
  - Inputs: replay arrays, configs; Outputs: pass/fail and coverage.
- Quick choice rule: pick Mocha if you want small/light and full control.
- Next step: add a tiny FSM test with chai.expect assertions.
