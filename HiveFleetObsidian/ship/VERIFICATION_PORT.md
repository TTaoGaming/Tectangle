# Verification Port (HFO Ship)

## Contract

- Inputs: project root; optional test selectors; golden JSONL traces
- Outputs: pass/fail status + artifacts (logs, reports)
- Success: All selected gates pass; otherwise fail closed

## Gates

- Smoke: minimal boot + sanity
- Goldens: replay JSONL traces; parity assertions
- Third-party: external validators (e.g., linters, format, schema)

## CLI (Windows PowerShell)

- Smoke: npm run hive:heartbeat
- Verify (safe): npm run hive:freeze:verify

## Notes

- Only "verified: true" items are promoted in rollups.
- Failing gates remain NOT-PRODUCTION-READY; attach diagnostics.
