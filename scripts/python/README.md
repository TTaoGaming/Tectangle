MP4 → MediaPipe Landmarks (Deterministic Extractor)

Overview
- This Python script extracts per-frame hand landmarks from an MP4 using MediaPipe (CPU) and writes a JSONL trace compatible with the hexagonal app’s deterministic replays.

Install (once)
1) Create/activate a virtualenv (recommended)
2) Install deps:
   pip install -r scripts/python/requirements.txt

Usage
- Extract landmarks JSONL:
  python scripts/python/extract_landmarks.py \
    --input "September2025/TectangleHexagonal/videos/samples/right_hand_normal.mp4" \
    --output "tests/landmarks/right_hand_normal.landmarks.jsonl"

- Then run deterministic replays (Node):
  node tests/replay/replay_core_from_trace.mjs tests/landmarks/right_hand_normal.landmarks.jsonl
  DEMO_URL=http://localhost:8080/September2025/TectangleHexagonal/dev/index.html \
    node tests/replay/replay_page_from_trace.cjs tests/landmarks/right_hand_normal.landmarks.jsonl

Notes
- The extractor writes normalized image coordinates (x,y in 0..1, z:=0 placeholder) for:
  indexTip(8), thumbTip(4), wrist(0), indexMCP(5), pinkyMCP(17), plus `hand` ("Left"|"Right").
- Timestamp `t` is in ms (derived from frame index and FPS).

