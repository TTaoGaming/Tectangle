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

# Logic Rollup — MDP_REFERENCE_20250417

Source: Knowledge backup 20250912/MDP_REFERENCE_20250417.md

Quick reference

- LOGICS (reference)

## OPTIONS

- Adopt: Ensure LandmarksRaw excludes images; only numeric low-PII.
- Adapt: Optional hashing for device/session IDs.
- Invent: Differential privacy layer.

## PICK

- Adopt — we already favor low-PII numeric streams.

## SLICE

- Document contract explicitly: no frames persisted by default; add allowImages flag false by default.

## LOGICS (reference)

- Contract (LandmarksRaw): { landmarks:`number[21][3]`, width, height, ts, frameId, handsCount, configHash } — no images.
- Consent gate: require consent.optIn===true for any non-memory sink; otherwise drop IDs.
- IDs: deviceId = sha256(salt+rawId); rotate salt weekly; store hash only.
- Session: ephemeral sessionId (UUIDv4), TTL 24h; do not persist across restarts unless consent.
- Redaction: strip fields matching /(image|bitmap|pixels)/i from detail; tags whitelist: [deviceModel, appVersion, owner_module].
- Retention: JSONL rotate daily; maxAge 7d; export requires allowExport and user prompt.
- Sinks whitelist: ["jsonl","window"]; block network unless allowNetwork===true.
- Frames: allowImages default false; require allowImages && consent.optIn to write any frame.
- Enforcement: Watchdog validates, emits watchdog:violation with reason on breach.

Tiny pseudocode

```js
function enforcePolicy(env, flags, consent) {
	if (!consent?.optIn) {
		delete env.tags?.deviceId; delete env.tags?.controllerId;
	}
	env.detail = redact(env.detail, /(image|bitmap|pixels)/i);
	if (!flags.allowNetwork) disableNetworkSinks();
	if (!(flags.allowImages && consent?.optIn)) dropFrameWrites();
	rotateAndTrim('jsonl', { maxDays: 7 });
}
```

Next slice

- Wire these checks in TelemetryManager + Watchdog; add unit tests for redaction and sink gating.
