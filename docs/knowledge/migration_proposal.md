# Migration proposal: Canonicalize top 12 Gold documents into docs/knowledge/

Summary: Lists the top 12 Gold artifacts (from [`docs/doc_inventory.json`](docs/doc_inventory.json:1)) recommended for canonicalization into [`docs/knowledge/`](docs/knowledge/:1), with suggested canonical filenames, YAML headers, and flags.

Candidates (ordered by priority):

1. [`September2025/Tectangle/docs/Consolidated_Pinch_Report_2025-09-06.md`](September2025/Tectangle/docs/Consolidated_Pinch_Report_2025-09-06.md:1) → [`docs/knowledge/Tectangle_consolidated_pinch_report_20250906.md`](docs/knowledge/Tectangle_consolidated_pinch_report_20250906.md:1)
   Reason: header_timestamp 2025-09-06 and high word_count (1165); consolidated executive report (duplicate_count=2; likely AI-generated).
2. [`September2025/Tectangle/docs/Project_Timeline_Summary_2025-09-06.md`](September2025/Tectangle/docs/Project_Timeline_Summary_2025-09-06.md:1) → [`docs/knowledge/Tectangle_project_timeline_summary_20250906.md`](docs/knowledge/Tectangle_project_timeline_summary_20250906.md:1)
   Reason: header_timestamp 2025-09-06; broad timeline & canonicalization guidance (word_count=1096; duplicate_count=2; likely AI-generated).
3. [`September2025/PinchFSM/docs/two-pagers/Lego_Design_Principles_TwoPager_2025-09-05.md`](September2025/PinchFSM/docs/two-pagers/Lego_Design_Principles_TwoPager_2025-09-05.md:1) → [`docs/knowledge/PinchFSM_lego_design_principles_20250905.md`](docs/knowledge/PinchFSM_lego_design_principles_20250905.md:1)
   Reason: header_timestamp 2025-09-05; foundational design principles for the PinchFSM domain (word_count=703; duplicate_count=3).
4. [`September2025/PinchFSM/docs/two-pagers/Hexagonal_Key_Human_Camera_TwoPager_2025-09-05.md`](September2025/PinchFSM/docs/two-pagers/Hexagonal_Key_Human_Camera_TwoPager_2025-09-05.md:1) → [`docs/knowledge/PinchFSM_hexagonal_key_human_camera_20250905.md`](docs/knowledge/PinchFSM_hexagonal_key_human_camera_20250905.md:1)
   Reason: header_timestamp 2025-09-05; architecture & demo pattern guidance (word_count=545; duplicate_count=3).
5. [`September2025/PinchFSM/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z copy.md`](September2025/PinchFSM/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z copy.md:1) → [`docs/knowledge/PinchFSM_human_capabilities_20250905.md`](docs/knowledge/PinchFSM_human_capabilities_20250905.md:1)
   Reason: precise timestamp 2025-09-05T03:01:33Z and substantive content (word_count=916; duplicate_count=3).
6. [`September2025/PinchFSMHumanVlad/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z copy.md`](September2025/PinchFSMHumanVlad/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z copy.md:1) → [`docs/knowledge/PinchFSMHumanVlad_human_capabilities_20250905.md`](docs/knowledge/PinchFSMHumanVlad_human_capabilities_20250905.md:1)
   Reason: mirrored copy under PinchFSMHumanVlad (duplicate of candidate 5; prefer a single canonical source per project).
7. [`September2025/PinchFSMHumanVlad/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z.md`](September2025/PinchFSMHumanVlad/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z.md:1) → [`docs/knowledge/PinchFSMHumanVlad_human_capabilities_20250905.md`](docs/knowledge/PinchFSMHumanVlad_human_capabilities_20250905.md:1)
   Reason: alternate archival copy (smaller extract); flagged duplicate to review (duplicate_count=4).
8. [`September2025/PinchFSM/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z.md`](September2025/PinchFSM/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z.md:1) → [`docs/knowledge/PinchFSM_human_capabilities_20250905.md`](docs/knowledge/PinchFSM_human_capabilities_20250905.md:1)
   Reason: archive copy under PinchFSM; consolidate duplicates into project-owned canonical (duplicate_count=4).
9. [`September2025/PinchFSMHumanVlad/docs/archive/PinchFSM_OnePager_2025-09-05T02-46-21Z.md`](September2025/PinchFSMHumanVlad/docs/archive/PinchFSM_OnePager_2025-09-05T02-46-21Z.md:1) → [`docs/knowledge/PinchFSMHumanVlad_pinchfsm_onepager_024621_20250905.md`](docs/knowledge/PinchFSMHumanVlad_pinchfsm_onepager_024621_20250905.md:1)
   Reason: timestamped one-pager (2025-09-05T02:46:21Z)—concise plan (word_count=111); include time in slug to disambiguate duplicates.
10. [`September2025/PinchFSM/docs/archive/PinchFSM_OnePager_2025-09-05T02-46-21Z.md`](September2025/PinchFSM/docs/archive/PinchFSM_OnePager_2025-09-05T02-46-21Z.md:1) → [`docs/knowledge/PinchFSM_pinchfsm_onepager_024621_20250905.md`](docs/knowledge/PinchFSM_pinchfsm_onepager_024621_20250905.md:1)
   Reason: project-level mirror of the one-pager (word_count=111; duplicate_count=4).
11. [`September2025/PinchFSMHumanVlad/docs/archive/PinchFSM_OnePager_2025-09-05T02-26-10Z.md`](September2025/PinchFSMHumanVlad/docs/archive/PinchFSM_OnePager_2025-09-05T02-26-10Z.md:1) → [`docs/knowledge/PinchFSMHumanVlad_pinchfsm_onepager_022610_20250905.md`](docs/knowledge/PinchFSMHumanVlad_pinchfsm_onepager_022610_20250905.md:1)
   Reason: another timestamped one-pager (02:26:10Z), useful short plan (word_count=167; duplicate_count=4).
12. [`September2025/PinchFSM/docs/archive/PinchFSM_OnePager_2025-09-05T02-26-10Z.md`](September2025/PinchFSM/docs/archive/PinchFSM_OnePager_2025-09-05T02-26-10Z.md:1) → [`docs/knowledge/PinchFSM_pinchfsm_onepager_022610_20250905.md`](docs/knowledge/PinchFSM_pinchfsm_onepager_022610_20250905.md:1)
   Reason: project mirror of the short one-pager (word_count=167; duplicate_count=4).

Manifest (JSON):

```json
{
  "candidates": [
    {
      "original_path": "[`September2025/Tectangle/docs/Consolidated_Pinch_Report_2025-09-06.md`](September2025/Tectangle/docs/Consolidated_Pinch_Report_2025-09-06.md:1)",
      "reason_for_choice": "header_timestamp 2025-09-06; word_count 1165; consolidated executive report.",
      "recommended_canonical_path": "[`docs/knowledge/Tectangle_consolidated_pinch_report_20250906.md`](docs/knowledge/Tectangle_consolidated_pinch_report_20250906.md:1)",
      "proposed_yaml_header": "---\ntitle: \"Consolidated Pinch Report\"\ncreated_at: \"2025-09-06\"\nsource: \"September2025/Tectangle/docs/Consolidated_Pinch_Report_2025-09-06.md\"\nauthor: \"auto-generated\"\nhuman_verified: false\n---",
      "flags": [
        "duplicate (2)",
        "likely_ai_generated"
      ]
    },
    {
      "original_path": "[`September2025/Tectangle/docs/Project_Timeline_Summary_2025-09-06.md`](September2025/Tectangle/docs/Project_Timeline_Summary_2025-09-06.md:1)",
      "reason_for_choice": "header_timestamp 2025-09-06; word_count 1096; project-level timeline and canonicalization guidance.",
      "recommended_canonical_path": "[`docs/knowledge/Tectangle_project_timeline_summary_20250906.md`](docs/knowledge/Tectangle_project_timeline_summary_20250906.md:1)",
      "proposed_yaml_header": "---\ntitle: \"Project Timeline & Canonicalization Report\"\ncreated_at: \"2025-09-06\"\nsource: \"September2025/Tectangle/docs/Project_Timeline_Summary_2025-09-06.md\"\nauthor: \"auto-generated\"\nhuman_verified: false\n---",
      "flags": [
        "duplicate (2)",
        "likely_ai_generated"
      ]
    },
    {
      "original_path": "[`September2025/PinchFSM/docs/two-pagers/Lego_Design_Principles_TwoPager_2025-09-05.md`](September2025/PinchFSM/docs/two-pagers/Lego_Design_Principles_TwoPager_2025-09-05.md:1)",
      "reason_for_choice": "header_timestamp 2025-09-05; foundational design principles (word_count 703).",
      "recommended_canonical_path": "[`docs/knowledge/PinchFSM_lego_design_principles_20250905.md`](docs/knowledge/PinchFSM_lego_design_principles_20250905.md:1)",
      "proposed_yaml_header": "---\ntitle: \"Lego Design Principles\"\ncreated_at: \"2025-09-05\"\nsource: \"September2025/PinchFSM/docs/two-pagers/Lego_Design_Principles_TwoPager_2025-09-05.md\"\nauthor: \"auto-generated\"\nhuman_verified: false\n---",
      "flags": [
        "duplicate (3)"
      ]
    },
    {
      "original_path": "[`September2025/PinchFSM/docs/two-pagers/Hexagonal_Key_Human_Camera_TwoPager_2025-09-05.md`](September2025/PinchFSM/docs/two-pagers/Hexagonal_Key_Human_Camera_TwoPager_2025-09-05.md:1)",
      "reason_for_choice": "header_timestamp 2025-09-05; architecture + demo guidance (word_count 545).",
      "recommended_canonical_path": "[`docs/knowledge/PinchFSM_hexagonal_key_human_camera_20250905.md`](docs/knowledge/PinchFSM_hexagonal_key_human_camera_20250905.md:1)",
      "proposed_yaml_header": "---\ntitle: \"Hexagonal Key Human Camera\"\ncreated_at: \"2025-09-05\"\nsource: \"September2025/PinchFSM/docs/two-pagers/Hexagonal_Key_Human_Camera_TwoPager_2025-09-05.md\"\nauthor: \"auto-generated\"\nhuman_verified: false\n---",
      "flags": [
        "duplicate (3)"
      ]
    },
    {
      "original_path": "[`September2025/PinchFSM/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z copy.md`](September2025/PinchFSM/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z copy.md:1)",
      "reason_for_choice": "header_timestamp 2025-09-05T03:01:33Z; substantive one-pager (word_count 916).",
      "recommended_canonical_path": "[`docs/knowledge/PinchFSM_human_capabilities_20250905.md`](docs/knowledge/PinchFSM_human_capabilities_20250905.md:1)",
      "proposed_yaml_header": "---\ntitle: \"Human: Capabilities One-Pager\"\ncreated_at: \"2025-09-05T03:01:33Z\"\nsource: \"September2025/PinchFSM/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z copy.md\"\nauthor: \"auto-generated\"\nhuman_verified: false\n---",
      "flags": [
        "duplicate (3)"
      ]
    },
    {
      "original_path": "[`September2025/PinchFSMHumanVlad/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z copy.md`](September2025/PinchFSMHumanVlad/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z copy.md:1)",
      "reason_for_choice": "mirrored content under PinchFSMHumanVlad (duplicate of candidate 5; word_count 916).",
      "recommended_canonical_path": "[`docs/knowledge/PinchFSMHumanVlad_human_capabilities_20250905.md`](docs/knowledge/PinchFSMHumanVlad_human_capabilities_20250905.md:1)",
      "proposed_yaml_header": "---\ntitle: \"Human: Capabilities One-Pager\"\ncreated_at: \"2025-09-05T03:01:33Z\"\nsource: \"September2025/PinchFSMHumanVlad/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z copy.md\"\nauthor: \"auto-generated\"\nhuman_verified: false\n---",
      "flags": [
        "duplicate (3)"
      ]
    },
    {
      "original_path": "[`September2025/PinchFSMHumanVlad/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z.md`](September2025/PinchFSMHumanVlad/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z.md:1)",
      "reason_for_choice": "archival copy (shorter); mark for duplicate-resolution (duplicate_count=4).",
      "recommended_canonical_path": "[`docs/knowledge/PinchFSMHumanVlad_human_capabilities_20250905.md`](docs/knowledge/PinchFSMHumanVlad_human_capabilities_20250905.md:1)",
      "proposed_yaml_header": "---\ntitle: \"Human: Capabilities One-Pager\"\ncreated_at: \"2025-09-05T03:01:33Z\"\nsource: \"September2025/PinchFSMHumanVlad/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z.md\"\nauthor: \"auto-generated\"\nhuman_verified: false\n---",
      "flags": [
        "duplicate (4)"
      ]
    },
    {
      "original_path": "[`September2025/PinchFSM/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z.md`](September2025/PinchFSM/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z.md:1)",
      "reason_for_choice": "archive copy and project mirror (duplicate_count=4); consolidate into project canonical.",
      "recommended_canonical_path": "[`docs/knowledge/PinchFSM_human_capabilities_20250905.md`](docs/knowledge/PinchFSM_human_capabilities_20250905.md:1)",
      "proposed_yaml_header": "---\ntitle: \"Human: Capabilities One-Pager\"\ncreated_at: \"2025-09-05T03:01:33Z\"\nsource: \"September2025/PinchFSM/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z.md\"\nauthor: \"auto-generated\"\nhuman_verified: false\n---",
      "flags": [
        "duplicate (4)"
      ]
    },
    {
      "original_path": "[`September2025/PinchFSMHumanVlad/docs/archive/PinchFSM_OnePager_2025-09-05T02-46-21Z.md`](September2025/PinchFSMHumanVlad/docs/archive/PinchFSM_OnePager_2025-09-05T02-46-21Z.md:1)",
      "reason_for_choice": "timestamped one-pager 2025-09-05T02:46:21Z (word_count 111); compact plan.",
      "recommended_canonical_path": "[`docs/knowledge/PinchFSMHumanVlad_pinchfsm_onepager_024621_20250905.md`](docs/knowledge/PinchFSMHumanVlad_pinchfsm_onepager_024621_20250905.md:1)",
      "proposed_yaml_header": "---\ntitle: \"PinchFSM One-Pager\"\ncreated_at: \"2025-09-05T02:46:21Z\"\nsource: \"September2025/PinchFSMHumanVlad/docs/archive/PinchFSM_OnePager_2025-09-05T02-46-21Z.md\"\nauthor: \"auto-generated\"\nhuman_verified: false\n---",
      "flags": [
        "duplicate (4)"
      ]
    },
    {
      "original_path": "[`September2025/PinchFSM/docs/archive/PinchFSM_OnePager_2025-09-05T02-46-21Z.md`](September2025/PinchFSM/docs/archive/PinchFSM_OnePager_2025-09-05T02-46-21Z.md:1)",
      "reason_for_choice": "project mirror of timestamped one-pager (word_count 111).",
      "recommended_canonical_path": "[`docs/knowledge/PinchFSM_pinchfsm_onepager_024621_20250905.md`](docs/knowledge/PinchFSM_pinchfsm_onepager_024621_20250905.md:1)",
      "proposed_yaml_header": "---\ntitle: \"PinchFSM One-Pager\"\ncreated_at: \"2025-09-05T02:46:21Z\"\nsource: \"September2025/PinchFSM/docs/archive/PinchFSM_OnePager_2025-09-05T02-46-21Z.md\"\nauthor: \"auto-generated\"\nhuman_verified: false\n---",
      "flags": [
        "duplicate (4)"
      ]
    },
    {
      "original_path": "[`September2025/PinchFSMHumanVlad/docs/archive/PinchFSM_OnePager_2025-09-05T02-26-10Z.md`](September2025/PinchFSMHumanVlad/docs/archive/PinchFSM_OnePager_2025-09-05T02-26-10Z.md:1)",
      "reason_for_choice": "timestamped one-pager 2025-09-05T02:26:10Z (word_count 167); concise plan variant.",
      "recommended_canonical_path": "[`docs/knowledge/PinchFSMHumanVlad_pinchfsm_onepager_022610_20250905.md`](docs/knowledge/PinchFSMHumanVlad_pinchfsm_onepager_022610_20250905.md:1)",
      "proposed_yaml_header": "---\ntitle: \"PinchFSM One-Pager\"\ncreated_at: \"2025-09-05T02:26:10Z\"\nsource: \"September2025/PinchFSMHumanVlad/docs/archive/PinchFSM_OnePager_2025-09-05T02-26-10Z.md\"\nauthor: \"auto-generated\"\nhuman_verified: false\n---",
      "flags": [
        "duplicate (4)"
      ]
    },
    {
      "original_path": "[`September2025/PinchFSM/docs/archive/PinchFSM_OnePager_2025-09-05T02-26-10Z.md`](September2025/PinchFSM/docs/archive/PinchFSM_OnePager_2025-09-05T02-26-10Z.md:1)",
      "reason_for_choice": "project mirror of the one-pager (word_count 167).",
      "recommended_canonical_path": "[`docs/knowledge/PinchFSM_pinchfsm_onepager_022610_20250905.md`](docs/knowledge/PinchFSM_pinchfsm_onepager_022610_20250905.md:1)",
      "proposed_yaml_header": "---\ntitle: \"PinchFSM One-Pager\"\ncreated_at: \"2025-09-05T02:26:10Z\"\nsource: \"September2025/PinchFSM/docs/archive/PinchFSM_OnePager_2025-09-05T02-26-10Z.md\"\nauthor: \"auto-generated\"\nhuman_verified: false\n---",
      "flags": [
        "duplicate (4)"
      ]
    }
  ]
}
```

Next steps:

- [ ] Confirm this candidate list and resolve duplicates
- [ ] Approve canonical paths and metadata
- [ ] Run canonicalization / auto-normalize script to perform moves (proposal-only; no moves made yet)
