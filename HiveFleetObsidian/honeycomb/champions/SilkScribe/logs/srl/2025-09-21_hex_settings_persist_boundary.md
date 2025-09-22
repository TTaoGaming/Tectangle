# SRL | 2025-09-21T00:00:00Z | ww-2025-101

Focus: Fix hex boundary lint by removing adapter->app import.
Signals: depcruise no-import-app violation between adapters/localStorageSettingsAdapter.js and app/featureFlags.js.
Decisions queued: None; DI used to inject flag function, defaulting to fallback.
Next audit: 2025-10-05
