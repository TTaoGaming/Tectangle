#!/usr/bin/env python3
"""
Extract MediaPipe Hand landmarks from an MP4 and write JSONL compatible with
the hexagonal pinch deterministic replays.

Output JSONL:
  Line 1: {"meta": {"src":"<input>", "fps": <fps>, "width": <w>, "height": <h>}}
  Lines N: {
    "t": <ms>, "hand": "Left"|"Right",
    "indexTip": [x,y,0], "thumbTip": [x,y,0], "wrist": [x,y,0],
    "indexMCP": [x,y,0], "pinkyMCP": [x,y,0]
  }
Coordinates are normalized (0..1) in image space. z is set to 0.
"""

import argparse
import json
import sys
import cv2
import numpy as np
import mediapipe as mp

HAND_IDS = {
    'WRIST': 0,
    'THUMB_TIP': 4,
    'INDEX_MCP': 5,
    'INDEX_TIP': 8,
    'PINKY_MCP': 17,
}

def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True, help='Path to MP4')
    ap.add_argument('--output', required=True, help='Output JSONL path')
    ap.add_argument('--max_frames', type=int, default=0, help='Optional cap on frames (0 = all)')
    return ap.parse_args()

def norm_landmark(lm, w, h):
    # MediaPipe Hands in Solutions returns normalized x,y already in [0,1], z in normalized depth.
    # We write x,y; z:=0 for compatibility with web pipeline expectations.
    x = float(lm.x)
    y = float(lm.y)
    return [x, y, 0.0]

def main():
    args = parse_args()
    cap = cv2.VideoCapture(args.input)
    if not cap.isOpened():
        print(f'ERROR: cannot open video: {args.input}', file=sys.stderr)
        sys.exit(2)

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    hands = mp.solutions.hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
        model_complexity=1,
    )

    out = []
    out.append(json.dumps({"meta": {"src": args.input, "fps": fps, "width": width, "height": height}}))

    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if args.max_frames and idx >= args.max_frames:
            break
        # BGR to RGB
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = hands.process(rgb)
        t_ms = int((idx / fps) * 1000.0)

        if res.multi_hand_landmarks and res.multi_handedness:
            for lm_list, handed in zip(res.multi_hand_landmarks, res.multi_handedness):
                lm = lm_list.landmark
                def P(i):
                    return norm_landmark(lm[i], width, height)
                hand_label = handed.classification[0].label  # 'Left' or 'Right'
                rec = {
                    "t": t_ms,
                    "hand": 'Left' if hand_label == 'Left' else 'Right',
                    "indexTip": P(HAND_IDS['INDEX_TIP']),
                    "thumbTip": P(HAND_IDS['THUMB_TIP']),
                    "wrist":    P(HAND_IDS['WRIST']),
                    "indexMCP": P(HAND_IDS['INDEX_MCP']),
                    "pinkyMCP": P(HAND_IDS['PINKY_MCP']),
                }
                out.append(json.dumps(rec))

        idx += 1

    cap.release()
    hands.close()

    # Ensure output directory exists
    import os
    os.makedirs(os.path.dirname(args.output) or '.', exist_ok=True)
    with open(args.output, 'w', encoding='utf-8') as f:
        f.write("\n".join(out) + "\n")
    print(f'Wrote {len(out)-1} frames to {args.output}')

if __name__ == '__main__':
    main()
