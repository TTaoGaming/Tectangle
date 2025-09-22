# Controllers unit tests

These controller unit tests currently use Mocha-style pending `it(...)` placeholders.

- Intention: land scaffolds quickly while aligning with the existing mocha runner (see package.json scripts like `hex:test:unit`).
- Action items:
  - Replace each pending `it(...)` with an assertion-based test as the controller code lands.
  - If you prefer node:test, switch the runner in package.json and update all specs consistently.

WEBWAY:ww-2025-095 — guard-friendly scaffolding.
