<!--
STIGMERGY REVIEW HEADER
Status: Draft
Review started: 2025-09-17T08-41-03Z
Expires: 2025-09-24T08-41-03Z (auto-expire after 7 days)

Checklist:
- [ ] Link to relevant manifest rows
- [ ] Capture new findings after each session
- [ ] Promote resolved items to TODO_today summary
-->

# Anchor Interaction - Blackboard

## Focus
Anchor joystick, spatial drags, MPE expression mapping.

## Sources to Ingest
- [ ] (manifest) ../import_manifest.md
- [ ] metrics/doc_inventory_summary.md (scan for relevant entries)

## Active Findings
- `TAGS-MVP-Modular-Monolith-backup/index-modular-monolith.html` is the 29k-line production reference; anchors likely pruned from handsfree repo but preserved here for modular extraction.
- `handsfree/handsfree/spatial-anchor-MPE/` currently only ships directory scaffolding (js/ui/utils folders, sound banks, tests) with 0 source files - likely pruned during cleanup. Need to locate upstream implementation before anchor controls can be ported.


## Open Questions
- _None yet_

## Next Extraction Targets
- Trace missing anchor source (check interactive-projector/ or archives) and restore reference implementation for Hex anchors.
- Extract modular anchor components from TAGS backup and port to Hex architecture.




