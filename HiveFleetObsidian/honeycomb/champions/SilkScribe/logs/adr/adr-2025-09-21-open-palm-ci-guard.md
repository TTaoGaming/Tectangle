# ADR | 2025-09-21T00:00:00Z | ww-2025-095

Context: We need a minimal, adopt-first CI guard to verify two-hand presence and Open_Palm visibility per hand on a golden idle clip using the v3 offline page.

Decision: Patch v3 page to expose getRows/getJsonl (WEBWAY:ww-2025-095). Add Puppeteer runner tests/smoke/open_palm_idle_ci.mjs that loads the page with ?video=...&auto=1, captures JSONL/rows, computes per-hand Open_Palm frames and durations, and asserts that both hands show Open_Palm at least once. Wire npm script hex:openpalm:idle.

Consequences: We gain a fast, local CI check with artifacts for debugging. Future work may add duration thresholds and integrate into tiered pipelines. Revert is a simple script/file removal and backing out the page hook.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-095_open_palm_ci_guard.md)
