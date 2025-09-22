# Obsidian Blackboard â€” Project Stigmergy Hub

Purpose

- Single source of truth to coordinate engines, demos, and adoption plans. Bias to adopt-first using standards and existing apps; add minimal glue.

North-Star (plain language)

- Ship stable, fun gestures fast by leveraging MediaPipe Tasks (GestureRecognizer), proven game engines (PlayCanvas/Phaser/Babylon/Unity), and our Hex SDK v7 + IHC shells. Add a small controller persistence + lookahead + FSM clutch with hysteresis, and iterate behind flags.

Adopt-first Precedent Stack

- Input: MediaPipe Tasks (web) GestureRecognizer; optional Landmarker for richer joints
- Glue: Hex SDK v7 facade + adapters (pins to our events/telemetry)
- UI/Dev Console: IHC v13 (frozen shell), IHC v14 (research flags)
- Game Runtimes (pick by target):
  - PlayCanvas (WebGL-first, strong editor)
  - Phaser (2D-first, quick game loops)
  - Babylon (WebGL + 3D scene/physics)
  - Unity (mobile/desktop power; WebGL export if needed)
- Avatar/IK path: Three/Vite + VRM (3.x), drive hand/palm/pose via recognizer + landmarks; inverse kinematics from day one

Adoption Leverage (estimate)

- Gesture layer (MediaPipe Tasks): Very high leverage. We adopt canned gestures and landmarks; we only add thresholds, debouncing, and FSM.
- Engines (Phaser/PlayCanvas/Babylon): Very high leverage. Rendering, scenes, input, and asset pipelines are solved; we consume events.
- VRM/IK (three-vrm/UniVRM/babylon-vrm): High leverage. Rigging and animation runtime are solved; we map bone targets to landmarks.
- Tooling/CI (Hex scripts, IHC shell, sidecars): Very high leverage. We reuse smokes, goldens, exporters, and diagnostics as-is.
- Custom logic (FSM clutch + hysteresis + lookahead): Small, isolated adapter. Reversible, testable, and flag-gated.

Fork/Starter Candidates (mature precedents)

- three-vrm examples (VRM 1.0/3.x) â€” bone driving, humanoid constraints
- Babylon.js skeleton/rig samples; community VRM importers (babylon-vrm)
- PlayCanvas starter templates (scene, physics, input)
- Phaser official templates (2D scenes, physics, particles)
- GDevelop templates (rapid prototyping, web export)
- UniVRM (Unity) if/when we need native targets; keep web-first for now

Controller Logic (minimal custom)

- Finite State Machine with â€œclutchâ€ (press/hold/release) and hysteresis thresholds
- Persistence: emit debounced stable events (pinch_down/up, open, fist) with lookahead option
- Flags: enable/disable per-experiment (angle velocity/jerk, predictor fusion)

Smallest Safe Next Slice

1) Keep IHC v13 shell; pipe MediaPipe -> SDK v7 telemetry -> existing VM
2) Add FSM clutch + hysteresis adapter emitting stable events
3) Optionally wire a PlayCanvas/Phaser sample to consume these events

Guards

- hex:verify:fast, hex:smoke:v13:quick must pass
- Optional: hex:smoke:gesture:offline, hex:telemetry:golden:*

Where to Build/Validate

- Offline: `September2025/TectangleHexagonal/dev/gesture_tasks_offline_v3.html`
- Console: `September2025/TectangleHexagonal/dev/integrated_hand_console_v13.html` (frozen) / `..._v14.html` (active)
- SDK demo: `September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v7_material.html`
- Minimal camera landmark demo: `September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v1.html` (WEBWAY ww-2025-092)

Links

- Webway: `scaffolds/webway_stigmergy-blackboard.md`
- SRL/ADR: `HiveFleetObsidian/honeycomb/champions/SilkScribe/logs` (stigmergy_blackboard)

Import-Ready Bundles (2025-09-20)

- ADR template + ADR-001..005 live in HiveFleetObsidian/honeycomb/champions/SilkScribe/logs/adr/.
- SRL template + SRL-2025-09-20-0x live in HiveFleetObsidian/honeycomb/champions/SilkScribe/logs/srl/.
- JSONL mirrors for bulk import: HiveFleetObsidian/honeycomb/champions/SilkScribe/logs/import-ready/adrs-2025-09-20.jsonl and HiveFleetObsidian/honeycomb/champions/SilkScribe/logs/import-ready/srls-2025-09-20.jsonl.
- New binder arcade loop log: HiveFleetObsidian/honeycomb/champions/SilkScribe/logs/srl/SRL-2025-09-20-04.md.
- Use scaffolds/blackboard/stigmergy_blackboard.md as the coordination entry point; tag future SRLs with SRL-2025-09-20 lineage to keep the trail tight.
- New offline OPO runner demo: `/September2025/TectangleFSMRunner/dev/opo_runner.html` (smoke: `node September2025/TectangleFSMRunner/tests/smoke/run_opo_runner_demo.mjs <clip>`).
- Snapshot guard: `node September2025/TectangleFSMRunner/tests/smoke/opo_runner_snapshot.mjs <clip>` → `/September2025/TectangleFSMRunner/out/golden.two_hands_idle.v1.opo.snapshot.png` (see SRL-2025-09-20-05).
- Adapters-only virtualization plan: `HiveFleetObsidian/honeycomb/champions/SilkScribe/logs/notes/AdaptersOnlyToolVirtualization.md` (review SRL later today).
- Gesture→Touch controller spec: SRL-2025-09-20-06 (architecture + predictor + golden CI).

Notes

- Prefer adapters over rewrites; mark experimental code with WEBWAY:ww-2025-094 for easy revert.
- Stigmergy focus: controller visual demos + zero-trust CI (TODO_2025-09-20).

### Field Notes — 2025-09-21 (UTC)

- WinBox anomalies: In manual runs some app windows render with mismatched chrome or markers despite factory standardization. Our e2e factory guard passes (markers/classes good), but the camera card snapshot regressed. Hypothesis: mixed render paths and dynamic overlays (wallpaper note) create visual drift; programmatic open path is consistent while dock/manual path can still race.
- Cards strangler: Current “cards” set mixes stub and legacy panels. Propose strangler-fig: introduce a v2 cards facade that only uses `getOrCreateCardWindow` + Material preload; migrate one card at a time behind a flag; keep legacy panels available but hidden. Acceptance: uniform wb-dark + data-winbox-type markers and no inline legacy chrome.
- Wrist HUD state labels: Observed label/state inconsistencies on the wrist HUD (idle/trigger/held naming drift), especially under MP4 replay. Action: add a single source-of-truth mapping in HUD renderer; add a JSONL guard to assert label transitions during idle frames.

Next steps (guarded)

1) Add FEATURE_GSOS_CARDS_V2_STRANGLER and route sdk/api/events/settings first through the new facade. 2) Stabilize camera snapshots by hiding dynamic wallpaper notes under FEATURE_TEST_HIDE_NOISE in tests. 3) Wrist HUD: normalize label enums + add CI check (idle must remain idle over N frames in two-hands-idle golden).

Executive Summary â€” Gesture Arcade: Research-Grade, Infinite Mini-Games

TL;DR

Use MediaPipe + FSM clutch for reliable gesture inputs, pipe them into a web-first engine (Phaser/Babylon), and layer an AI swarm (image generation + evolutionary algorithms) to spawn endless reskinned, mutated party games. Core loop: free family-safe games, optional paid cosmetics.

Input Layer (controller)

* MediaPipe Gesture Recognizer = labels + confidence + landmarks (hands, pose, face).
* FSM clutch = Open_Palm â†’ Gesture â†’ Open_Palm (debounce, hysteresis, cooldown).

- Output = clean â€œbutton pressesâ€ for games, plus research-grade logs (landmarks, bone ratios, quaternions if needed).

Analogy: MediaPipe as USB controller driver; FSM as debounce circuit; event bus as the controller cable.

Game Layer (arcade builder)

* Engines: Phaser (fast 2D), Babylon/PlayCanvas (light 3D, avatars, VRM), GDevelop (rapid proto)
* Each game = scene/module subscribing to the GestureController.

- Local multiplayer: split camera zones, per-zone FSMs.

- Juice: particles, screen shake, sound pitch ramps; easy AI-generated reskins.

Research-Grade Path


## GSOS Camera Card — Behavior and Toggles (2025-09-21)

- Windowing: Camera now opens in a real WinBox when available; falls back to a styled stub otherwise.
- Fullscreen: add `?GSOS_FULLSCREEN=1` to maximize the Camera window on open.
- Source: add `?GSOS_CAMERA_SRC=v2|v13` to choose the harness in the Camera card.
  - v2 (default): wrist label + landmarks; no seat-locking UI, so “locks” won’t be visualized here.
  - v13: integrated console with seats and locks; use this to see claims via Open-Palm and follow re-acquire behavior.

Note (2025-09-21): We briefly flipped the GSOS default source to v13 while testing seat locks. That was a mistake. GSOS should default to the minimal camera demo (`camera_landmarks_wrist_label_v2.html`) and rely on Hexagonal adapters/ports exclusively. v13 remains opt-in via `?GSOS_CAMERA_SRC=v13` for debugging visuals; GSOS behavior and dependencies should not rely on v13.
- Tests: `window.__gso.openApp('camera')` opens the Camera programmatically; XState/MediaPipe/Seats cards remain available via the bottom bar.
- If you see landmarks not changing or no lock visuals, you’re likely on v2. Switch to v13 with `?GSOS_CAMERA_SRC=v13` or open the Seats card to inspect seat state.
- Store raw world landmarks (3D meters).
- Compute bone vectors, quaternions, ratios.

- Log JSON/CSV per frame for reproducibility.
- Optionally feed VRM rigs (three-vrm, UniVRM, Babylon skeletons).

- Outcome: playable + publishable as academic pipeline.

AI Swarm & Evolutionary Generation

- Expert kernel: FSM ensures valid games.
- Evolutionary algorithms (MAP-Elites, novelty search): mutate game rules (timing windows, thresholds, scoring, win conditions).
- Speciate mini-game families: jumpers, dashers, timers.

- Asset reskinning: image/video generation; prompt templates + fixed palettes/seeds for consistency; one-click swap â†’ new game feel.

Monetization & Safety

- Free forever, family-safe core; pay-what-you-want cosmetics (themes, skins, avatars, music packs); no paywall.

Options for Maximum Leverage

1. Ship now: Phaser + MediaPipe FSM â†’ itch.io PWA.
2. Scale games: AI swarm generates reskins/mutations on your spec.
3. Research credit: log landmark/quaternion data + publish pipeline.
4. Avatars/tools: layer VRM rigs, WebMIDI drum pads, VRM-to-MIDI mapping.

One Sentence Strategy

Start simple (FSM clutch + one-button mini-games), log everything research-grade, and let your AI swarm evolve and reskin games endlessly â€” free for families, funded by cosmetic joy.

Wiring Plan (contract sketch)

- GestureController: { seatId, buttons: { pinch, open, fist }, strength, ts }
- GameSpec: subscribes to GestureController events; exposes start(), update(dt), end(); reads difficulty seed
- Evolutionary Loop: mutate GameSpec params (windows, cooldowns, scoring); evaluate via fun/retention proxies; log outcomes

## Audit â€” TectangleHexagonal (readiness for 1â€‘hand FSM)

Whatâ€™s ready to use now (adopt directly)

- Gesture recognizer (MediaPipe Tasks) wired and working in `gesture_tasks_offline_v3.html` with perâ€‘frame label/score, JSONL/CSV export, FPS.
- Optional HandLandmarker already integrated for dots overlay; perâ€‘frame centers computed when enabled.
- Perâ€‘hand FSM scaffolding exists in V3 (Idle â†’ Triggered â†’ Held â†’ Released) with enter/exit thresholds and Openâ†’Fist sparkline buffers.
- Feature flags pattern present; WEBWAY markers in place; telemetry tables and validation helpers exist.
- IHC v13/v14 consoles for interactive inspection; v14 has research flags for angles/velocity/jerk/predictor fusion.

Gaps or light lift to meet current goal

- Enforce 1â€‘hand max path and explicitly gate by a feature flag (keep twoâ€‘hand code intact behind flags).
- Color the 21 landmarks by FSM state (Idle/Triggered/Held/Released) and draw them every frame.
- Display wrist world xyz and palm orientation estimate inline (derive from landmarks; show degrees for quick sanity).
- Single sparkline (one hand) always on, with pulse on Openâ†’Fist when clutch condition is met.
- Tighten Open_Palm â†’ Closed_Fist clutch logic (hysteresis + cooldown), ensure debounced trigger.

Proposed minimal slice (guarded)

- Page: `September2025/TectangleHexagonal/dev/gesture_tasks_offline_v3.html`
- Flags: FEATURE_ONE_HAND_FSM_V1, FEATURE_LANDMARK_COLOR_BY_FSM, FEATURE_PALM_ORIENT_V1
- Guard: keep existing smokes green; only visuals added; recognizer path unchanged.

## Seating & Visualization â€” Adoption Options

Goal: Robust 1â€“2 hand visualization with minimal bespoke logic, scalable to n hands later.

Options

1. Handedness-first seating

- How: Use MediaPipe handedness (Left/Right) to allocate HUD lanes and sparklines.
- Pros: Trivial to adopt; aligns with user intuition (left/right).
- Cons: Handedness can flip briefly when hands cross; needs debounce.

1. Zone-X seating (screen-normalized)

- How: Use landmark center x (0..1) and divide screen into left/right zones; assign to nearest empty zone with hysteresis.
- Pros: Works even if handedness is unstable; spatially consistent; simple.
- Cons: When two hands are in same zone, tie-break required; edge behavior needs hysteresis.

1. Short-term tracker (centroid persistence)

- How: Track per-hand centroids over time; nearest-neighbor to last seat; decay when missing.
- Pros: Best persistence; supports >2 hands later.
- Cons: More code; small state machine; overkill for today.

Recommendation

Adopt Option 2 now (Zone-X seating with hysteresis) + fall back to handedness when confident. Itâ€™s minimal, robust for 1â€“2 hands, and reversible. If we need >2 hands or stronger persistence, layer Option 3 later without changing interfaces.

## Overlay OS (windowed viz) â€” First Slice

What: Fullscreen camera with a bottom dock to launch small draggable/resizable windows (iframe apps). Keep it minimal and reversible.

Artifacts

- Page: `September2025/TectangleHexagonal/dev/overlay_os_v1.html`
- Apps: `dev/apps/app_sparkline_v1.html`, `dev/apps/app_handviz_v1.html`
- Flags: FEATURE_OS_CAMERA, FEATURE_OS_DRAG, FEATURE_OS_RESIZE

Adoption path

- Adopt simple in-page window manager (no external deps). Keep each app an iframe for isolation and swapability.
- Later: load apps from local modules or host engine scenes (Phaser/Babylon) in windows.
- Reversible: delete the page; iframe apps remain independent.


## Next moves (Webways)

- KeyMap + WristCompass: scaffolds/webway_ww-2025-104-keymap-wristcompass.md
- SDK/API v0 Facade: scaffolds/webway_ww-2025-105-sdk-api-v0.md
- GameBridge Dual Dino: scaffolds/webway_ww-2025-106-gamebridge-dino-dual.md
- ReplayLandmarks Hex: scaffolds/webway_ww-2025-103-replay-landmarks-hex.md

- GestureShellOS SeatManager v1: scaffolds/webway_ww-2025-107-gesture-shell-os.md


## Update — 2025-09-21 GSOS Cards + Material Guard

- GSOS harness now auto-opens core Cards (XState, MediaPipe, Seats) on load; toggle with `?FEATURE_GSOS_OPEN_ON_LOAD=0` or customize with `?GSOS_OPEN=xstate,seats`.
- Material Web readiness guard added at page load to preload core components; Cards use md-* components reliably in static ESM.
- Focus next: Open Palm calibration + Seat FSM using XState.
  - Guarded slice: `FEATURE_ONE_HAND_FSM_V1` adds Open→Gesture→Open path with hold/cooldown and hysteresis.
  - UI: small calibration Card (Material switches/sliders) for holdMs, cooldownMs, minScore; shows per-seat applied values.
  - Tests: keep GSOS shell smokes green; add one screenshot of calibration Card; assert no exceptions on apply.





## GSOS Wallpaper — Full-screen Camera (2025-09-21)

- The GSOS shell now supports a full-screen camera “wallpaper” behind all windows.
- Enabled by default. Disable with `?GSOS_WALLPAPER=0` if you need to free the camera for a foreground card.
- Source selection: `?GSOS_CAMERA_SRC=v2|v13` is respected by the wallpaper too; default is `v13` for visible seats/locks.
- Windows/cards remain on top (higher z-index). Use the Seats and XState cards to inspect state while the wallpaper runs.
- Note: Some browsers limit concurrent camera streams; if a foreground camera card fails to acquire, either close it or launch with `?GSOS_WALLPAPER=0`.




## Incident — GSOS Camera Card blank (2025-09-21, UTC)

- Status: Multiple errors observed; multiple attempts have not fixed the issue.
- Symptom: Camera Card opens blank while the OS webcam indicator is on (stream likely held elsewhere, e.g., wallpaper/another tab).
- Scope: GSOS shell (`September2025/TectangleHexagonal/dev/gesture_shell_os_v1.html`) on branch `hex-boundary-scan`.
- Consider: Git revert to the last known-green overlay state prior to the recent GSOS camera tweaks (pre Webway ww-2025-120 autostart-forwarding).
- Next checks (triage toggles before revert):
  - `?GSOS_WALLPAPER=0` to free camera from wallpaper.
  - `?GSOS_CAMERA_SRC=v13` to test the integrated console path (seat/lock UI).
  - `?FEATURE_GSOS_AUTOSTART_ON_CLIP=0` to disable autostart query injection.
  - If still blank, prefer revert over fix-forward to restore a known-good baseline.




