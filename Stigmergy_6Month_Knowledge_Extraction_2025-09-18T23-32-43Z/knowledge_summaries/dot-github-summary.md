<!--
STIGMERGY SUMMARY HEADER
Source: .github/
Generated: 2025-09-18T03:25Z
-->

# .github Summary (Copilot Guidance)

- `copilot-instructions.md` documents working rules for AI assistants interacting with the 59k-line TAGS monolith: run diagnostics (`window.runAllDiagnostics()`), use event bus (`MusicalGestureMediator.emit`), rely on tag navigation, and never bypass established patterns.
- Highlights critical modules (19 active + 5 wrappers) and emphasises production-ready status with 60fps performance; reinforces “event-driven, diagnostics-first” workflow.

**Action Hooks**
1. Copy these guardrails into forthcoming ADR covering AI-assisted editing.
2. Reference when onboarding new assistants or relocating the hub to keep Copilot behaviour consistent.
