# ADR | 2025-09-21T00:00:00Z | ww-2025-105

Context: Demos require a small, stable facade to avoid coupling to internals.
Decision: Create SDK/API v0 facade with `init/setKeyMap/on/exportTelemetry` and minimal event bus; gate via FEATURE_SDK_FACADE_V0.
Consequences: Unified adoption path; easier testing via ReplayLandmarks; small surface mitigates churn risk.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-105-sdk-api-v0.md)
