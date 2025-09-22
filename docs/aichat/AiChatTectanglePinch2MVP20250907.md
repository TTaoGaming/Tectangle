# Page 1 — Executive summary

**Goal.** A minimal, reliable pinch input using only three cues per hand: **palm orientation**, **index fingertip**, and **thumb fingertip**. The decision rule is a small finite-state machine (FSM) that watches the **normalized distance** between index and thumb, where normalization is by the **knuckle span** (index MCP ↔ pinky MCP). We keep thresholds at **enter ≈ 0.50** and **exit ≈ 0.70** to respect fingertip pad thickness (anything below \~0.20 tends to be unattainable because landmark points sit near the pad center, not the skin contact edge).

**Why this works.**

* The **palm cone gate** rejects off-plane gestures and many false positives.
* **Normalization** by knuckle span makes thresholds device- and scale-agnostic.
* **Hysteresis (50% enter / 70% exit)** prevents chattering at the boundary.
* Using only **two collision proxies** (index tip + thumb tip) keeps physics/contacts simple while still supporting tactile key or surface interactions later.

**Architecture fit (distributed hexagonal).**

* **Domain core**: OneEuro smoothing → palm gate → normalization → FSM.
* **Input adapter**: MediaPipe (camera or MP4 replay) emits only the landmarks you need: wrist, index\_tip (8), thumb\_tip (4), index\_MCP (5), pinky\_MCP (17).
* **Physics adapter (optional)**: two fingertip sphere colliders (kinematic targets) + an optional palm plane. Physics acts as a constraint filter; the domain still owns the pinch decision.
* **Visualization adapter**: overlay shows palm cone (angle + arrow), knuckle span, and live enter/exit thresholds in **norm / px / cm**.
* **Telemetry adapter**: JSONL with per-frame `t, controller_id, norm, gate, palm_angle`, plus events `pinch:down/hold/up`, confirm latency, and (if enabled) pre-fire lead & cancel%.

**Controller identity & “teleportation.”** Keep a tiny tracker in front of the core: nearest-neighbor (or constant-velocity KF) on wrist to maintain **Controller 1/2** with a **max jump** gate and **duplicate suppression** (drop the lower-confidence wrist if two overlap). This cures ID swaps without dragging in full-body physics.

**Recommended defaults.**

* Palm cone: **30°**; gate must pass.
* Thresholds: **enter 0.50**, **exit 0.70** (normalized units).
* Debounce: **40 ms** each side.
* OneEuro: **minCutoff 1.0**, **beta 0.01**, **dCutoff 1.0**.
* Auto-release safety: **5 s** (prevents stuck holds).
* Per-controller calibration: optional **fixed knuckle span (norm)** and **real-world span (cm)** for px↔cm conversions.

**Physics stance (for MVP).** Totally reasonable: drive **two fingertip kinematic targets** (index + thumb) in Rapier; read contact manifolds for richer feedback. Do **not** teleport dynamic bodies—servo joints toward filtered landmark goals. Keep the FSM as the source of truth for pinch; use physics primarily to reject impossible interpenetrations and to expose contact force/time if you want “feel.”

**Success criteria (ship bar).**

* <3% false pinches on MP4 goldens;
* confirm latency (index<→thumb crossing → `pinch:down`) **≤100–160 ms** median;
* spec-cancel% (if pre-fire is on) **<25%**;
* controller IDs remain stable on crossings/occlusions in test clips;
* debug UI always explains “why no pinch” (gate angle, norm above/below threshold, etc.).

---

# Page 2 — How to apply this to your project (plain language)

## 1) What landmarks to read, exactly

From MediaPipe per hand:

* **wrist (0)**, **index\_MCP (5)**, **pinky\_MCP (17)** → used to compute knuckle span and palm normal.
* **index\_tip (8)** and **thumb\_tip (4)** → used for pinch distance and physics fingertip proxies.
* Optional: handedness score (for tie-breaking).

## 2) Turn those into the three signals you need

1. **Palm orientation (gate)**

   * Build the palm normal with the cross product of vectors **wrist→index\_MCP** and **wrist→pinky\_MCP**.
   * Convert to an angle relative to the camera. If the angle ≤ **30°**, the **palm gate is “in”**; otherwise it’s “out.”
   * Draw a small ring at the wrist: **green when in**, **red when out**, plus an arrow showing the projected normal and a `XX°` label.

2. **Knuckle span**

   * `span_norm = ||index_MCP - pinky_MCP||` (MediaPipe normalized coordinates).
   * If it’s noisy or missing, fall back to your last calibration or a default (e.g., **0.08**).
   * Keep per-hand overrides: a **fixed normalized span** and (optionally) **real-world span in cm**.

3. **Normalized pinch distance**

   * `norm = ||index_tip - thumb_tip|| / span_norm`.
   * Show:

     * `enter = 0.50` and `exit = 0.70` in **norm** units,
     * convert to **pixels**: multiply by `(span_norm * overlay_width)`,
     * convert to **cm** if the user provided real span: `(pixels / (span_px / span_cm))`.

## 3) The tiny FSM (what to ship)

States: **Idle → PrePinch (optional) → Pinched → ReleasePending**.

* **Guard rails first** (every frame):

  * **Palm gate** must be in.
  * **Tracker gate**: controller ID has a plausible wrist displacement (no huge jumps).
* **Transitions:**

  * Idle → PrePinch/Pinched when `norm < 0.50` for **≥40 ms**.
  * Pinched → ReleasePending/Idle when `norm > 0.70` for **≥40 ms**.
  * Emit `pinch:down` on enter, `pinch:hold` every \~200 ms while pinched, `pinch:up` on exit.
  * **Auto-release** after **5 s** as a safety.

Why 0.50/0.70? Because your landmark points sit near the finger pad center; tissue thickness and pad curvature mean **“true contact” rarely looks like norm < 0.20**. Hysteresis at 0.50/0.70 gives a clean feel without requiring sub-pad precision.

Optional: **speculative pre-fire.** If velocity is closing and estimated time-to-enter is within \~120 ms, emit a speculative `pinch:down` and cancel if not confirmed. Track **spec-cancel%** to tune or disable.

## 4) Controller IDs that don’t “teleport”

Keep a two-slot tracker ahead of the FSM:

* For each frame, try to match current wrists to the last known **Controller 1/2** by nearest neighbor.
* Reject matches with a **max jump** (e.g., Δnorm > 0.15) and mark the controller as “lost” until a plausible candidate appears.
* If two wrists are nearly coincident, **drop the lower confidence** one.
* Add a short **switching dwell** (\~300 ms) after a confirmed pinch so IDs don’t flip during hand crossing.

## 5) Where physics fits (optional but compatible now)

* Make **two fingertip sphere colliders** per controller (index + thumb).
* Drive them as **kinematic targets** toward the **filtered** landmark positions (OneEuro smoothing).
* Read **contact presence/force** to enrich feedback (e.g., require contact with a key plane before allowing a pinch piano note).
* Keep the FSM as the **truth source** for `pinch:down/up`; physics is a helper to reject impossible overlaps and to add tactile realism.
* You don’t need full bones/joints for MVP—add capsules later only if you want self-blocking between digits.

## 6) Debug UI that keeps you honest

For **each controller** (1 & 2), display:

* Palm angle and gate status.
* Knuckle span: **norm** and **px**; show **px/cm** ratio if the user provided span in cm.
* Enter/exit thresholds in **px** and **cm**.
* Current `norm`, velocity/accel (optional), and **TOI** if you keep speculative mode.
* Knobs: per-hand fixed span (norm), per-hand real span (cm), palm cone angle, enter/exit thresholds, debounce times.
* Status badge + log for errors and rejections (no silent failures).

## 7) MP4 telemetry so you can tune quickly

* Record JSONL lines per frame: `t, controller_id, norm, palm_angle, gate, state`.
* Record events: `pinch:down/hold/up`, **confirm latency**, and **spec lead/cancel%** if enabled.
* Build 3–4 short “golden” MP4s: open/close slowly, fast taps, occlusion/crossing, and non-pinch movement.
* Sweep enter/exit thresholds (±0.05) and debounce (20–60 ms) to minimize false pinches and keep latency within your target.

## 8) Definition of done (MVP)

* The live overlay always explains non-activation (angle too high, norm above enter, lost ID, etc.).
* On goldens:

  * **false pinch rate <3%**,
  * **median confirm latency ≤160 ms**,
  * **controller IDs stable** across crossings,
  * if speculative on: **cancel% <25%** with mean pre-fire lead 60–120 ms.
* JSONL exporters and headless replay pass in CI (no unhandled rejections).

---

**Bottom line:** With only palm orientation and two fingertips, you can ship a robust pinch today. Normalize by knuckle span, gate by palm cone, run a tiny FSM with 0.50/0.70 hysteresis, and keep IDs stable with a two-slot tracker. Add fingertip contact proxies in physics if you want richer feedback—without letting physics take over the pinch decision.
