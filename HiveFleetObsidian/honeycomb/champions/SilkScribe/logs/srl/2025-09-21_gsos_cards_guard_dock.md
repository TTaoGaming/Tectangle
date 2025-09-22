# SRL | 2025-09-21T00:00:00Z | ww-2025-130

Focus: Stabilize cards registry guard and assert dock buttons open WinBox.

Signals: `__gso.getCards` was attached after async work; guard raced it. Added waitForFunction and dock click assertions.

Decisions queued: Consider moving `__gso.getCards` attachment earlier in GSOS boot or exposing a ready promise.

Next audit: 2025-09-28
