# Document Header Template (YAML)

Use this exact YAML front matter at the top of every new documentation or code header file in the repo.

Example:
---
Title: "Short Title Here"
CreatedAt: "2025-09-07T08:15:00Z"
Author: "Your Name"
Version: "0.1"
Tags: ["pinch","telemetry","prototype"]
HumanVerified: false
---

Guidelines:
- Title: PascalCase or Title Case short slug (no newlines).
- CreatedAt: ISO 8601 UTC timestamp (YYYY-MM-DDTHH:MM:SSZ).
- Author: person or "auto-generated" for scaffolded files.
- Version: semantic-ish, start at 0.1 for drafts.
- Tags: small array of searchable tokens.
- HumanVerified: set to true only after a human confirms the content.

Usage:
1. Copy the template at the top of the file.
2. Fill in fields before committing.
3. CI will run a header-check workflow to ensure presence and basic schema.

Example (actual file top):
---
Title: "Pinch_Feature_Plan"
CreatedAt: "2025-09-07T08:15:00Z"
Author: "Tommy"
Version: "0.1"
Tags: ["pinch","design","hexagonal"]
HumanVerified: false
---