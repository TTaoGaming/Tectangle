What are you doing<!--
STIGMERGY DAILY SRL
Month: 2025-01
Generated: 2025-09-17T16:05Z
Sources: file modification timeline (top dir = Tectangle Project folder)
-->

# January 2025 Daily SRL

## 2025-01-18
- **Plan/Focus:** Bootstrap ARUCO-driven prototype in `Tectangle/my-project/js-aruco2`.
- **What Worked:** Got baseline ARUCO tracking code stubbed; first reliable pinch distances logged.
- **What Didn�t:** No repo yet; experiments lived in raw files with no recovery path.
- **Carry Forward:** For Hex agents, always wrap brand-new experiments in a branch + ADR so sensor lessons persist.

## 2025-01-20
- **Plan/Focus:** Wire tracking output into the early drumpad UI.
- **What Worked:** Produced first visual feedback loop�canvas responded to pinch states.
- **What Didn�t:** Latency spikes when camera + audio were multiplexed in same script.
- **Carry Forward:** Separate capture + rendering loops; in distributed hexes, dedicate agents per concern.

## 2025-01-21
- **Plan/Focus:** Expand gesture library beyond thumb�index pinch.
- **What Worked:** Added multi-finger mappings; explored flexion measurement macros.
- **What Didn�t:** Gesture thresholds hard-coded; rapid context switching increased restart risk.
- **Carry Forward:** Store threshold tables in config docs (now `Knowledge backup 20250417`), and plan a telemetry schema early.

## 2025-01-22
- **Plan/Focus:** Heavy build of monolithic index (122k lines touched).
- **What Worked:** Core pinch-to-sound pipeline came alive; UI scaffolding matured.
- **What Didn�t:** Monolithic file became unmanageable; zero ADR captured.
- **Carry Forward:** Current hex modules must stay modular; record why splits happen via ADR-Jan22-monolith-split.

## 2025-01-23
- **Plan/Focus:** Stabilize UI/calibration.
- **What Worked:** Added ROI calibration panel; improved camera alignment logic.
- **What Didn�t:** Calibration logic still mixed with rendering; lacking telemetry.
- **Carry Forward:** Maintain separation of calibration agents + UI presenters in hex architecture.

## 2025-01-24
- **Plan/Focus:** Tune audio triggering reliability.
- **What Worked:** Balanced velocity curves; reduced missed strikes.
- **What Didn�t:** Audio chain still synchronous; caused frame drops.
- **Carry Forward:** Adopt event queues + async audio in new swarms.

## 2025-01-25
- **Plan/Focus:** Add more instrument layers (16k lines touched).
- **What Worked:** Multi-instrument mapping for drumpad squares; sample switching worked.
- **What Didn�t:** Manual sample management; disk footprint ballooned.
- **Carry Forward:** Use centralized asset service & ADR on sample strategy.

## 2025-01-26
- **Plan/Focus:** Iterate on UX + analytics.
- **What Worked:** Session logging started; early idea for telemetry counters.
- **What Didn�t:** Logs stored ad-hoc; no consistent process to review them.
- **Carry Forward:** For swarms, adopt structured logging (now in `telemetry_sync` plan) and daily SRL notes.

## 2025-01-29
- **Plan/Focus:** Light cleanup & organization.
- **What Worked:** Tidy up directories; prepping for next big push.
- **What Didn�t:** Still no version control decisions.
- **Carry Forward:** Always pair cleanup with commit + ADR (even if minor).

## 2025-01-30
- **Plan/Focus:** Second heavy monolith build (~85k lines).
- **What Worked:** UI matured, multi-tab layout introduced; more stable pinch pipeline.
- **What Didn�t:** Complexity kept growing; restart syndrome looming.
- **Carry Forward:** Document the pain�ADR-Jan30-monolith-overload�to justify the modular migration that follows.

