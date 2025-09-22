# ADR | 2025-09-21T00:00:00Z | ww-2025-132

Context: Manual UX reveals WinBox inconsistencies (chrome/markers) not caught by structural guard; camera card visuals drift due to dynamic overlays; wrist HUD labels inconsistent during idle/trigger states under MP4 replay.

Decision: Introduce a v2 cards facade (strangler) that strictly routes opens through getOrCreateCardWindow and Material preload; hide dynamic overlays in CI via a test-only flag; normalize wrist HUD label enums and add a JSONL idle stability guard.

Consequences: Uniform window chrome across cards, reduced snapshot noise, and stable HUD labels; incremental migration with flags; legacy panels remain for fallback during cutover.

Links: [Webway note](../../../../../../scaffolds/webway_gsos_cards.md)
