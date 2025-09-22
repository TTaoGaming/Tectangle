---
title: "Human: Capabilities One-Pager"
created_at: "2025-09-05T03:01:33Z"
source: "September2025/PinchFSM/docs/archive/Human_Capabilities_OnePager_2025-09-05T03-01-33Z.md"
author: "auto-generated"
human_verified: false
---
Human: Capabilities One‑Pager for PinchFSM Phase‑0
=================================================

```yaml
title: "Human: Capabilities One‑Pager for PinchFSM Phase‑0"
doc_type: one-pager
timestamp: 2025-09-05T03:01:33Z
tags: [Human, capabilities]
summary: "Human provides real‑time hand landmarks, handedness, gesture utils, and on‑device models for pinch→events with minimal code."
source_path: "September2025/PinchFSM/docs/Human_Capabilities_OnePager_2025-09-05T03-01-33Z.md"
```

Timestamp: 2025-09-05T03:01:33Z  
Location: September2025/PinchFSM/docs/Human_Capabilities_OnePager_2025-09-05T03-01-33Z.md

---

Plain‑language summary

- vladmandic/human wraps TF.js models for hands and landmarks; Phase‑0 can use it for thumb/index tips and knuckles with gesture utilities.

Key extracts

- 21‑point landmarks; model assets; gesture helpers; multiple backends; demos; on‑device binaries.

Integration options

- CDN embed, npm install, or local demo copy; trade‑offs noted.

Practical plan & metrics

- Minimal demo, compute normalized P = dist(4,8)/dist(5,17), hysteresis + palm gating; smoothing (One Euro/Kalman); visualization and golden traces.
