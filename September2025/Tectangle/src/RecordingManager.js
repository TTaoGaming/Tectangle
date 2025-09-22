/**
 * TLDR: RecordingManager — Record gesture-triggered events (mapped keys) and optional audio/sound timestamps; export standardized recording files (JSON) and provide simple playback API. Default runtime target: 480p @ 30FPS.
 *
 * Executive summary (5W1H):
 *  - Who: Users recording performance layers, QA and demo authors.
 *  - What: Capture standardized event records { ts, frameId, mappedKey, velocity? }, support start/stop/save/export, and optionally include audio markers or host sound timestamps.
 *  - When: Recording starts via UI or programmatic API; events appended until stop; saved on demand.
 *  - Where: Mobile / Chromebook demos and local manual exports (download JSON).
 *  - Why: Provide a minimal, consistent recording format for playback, looping, and tuning calibration via example sessions.
 *  - How: Provide startRecording(), stopRecording(), addEvent(evt), export(filename) and simple playback controls (play(), pause(), seek()).
 *
 * Top responsibilities:
 *  - Provide deterministic per-event recording (minimal, low-PII) with timestamps and optional meta.
 *  - Export recordings to JSON files and allow import/playback via the GestureLooperManager.
 *  - Expose a small API and EventBus hooks 'recording:started','recording:stopped','recording:exported'.
 *
 * API summary:
 *  - async init(params)
 *  - startRecording(meta), stopRecording(), isRecording()
 *  - addEvent(record), exportJSON(filename)
 *  - play(recording), pause(), stop()
 *
 * Test protocol summary:
 *  - Unit: simulate stream of 'adapter:mapped_key' events; assert recording contains expected entries and export produces valid JSON.
 *
 * EARS Acceptance Criteria:
 *  - TREQ-122 — When startRecording() is invoked, the system shall begin recording canonical events to an in-memory sequence and publish 'recording:started'.
 *  - TREQ-122a — When stopRecording() is invoked, the system shall publish 'recording:stopped' and keep the in-memory sequence available for export or playback.
 *  - TREQ-122b — When exportJSON(filename) is invoked, the system shall write a JSON file containing a deterministic array of recorded events with timestamps and metadata.
 *
 * UI_METADATA:
 *  { tabId: 'recording', title: 'Recording', order: 11 }
 *
 * Usage snippet:
 *  // const r = new RecordingManager(); await r.init(); r.startRecording({ name:'session1' }); r.addEvent({ ts:Date.now(), code:'KeyA' }); r.stopRecording(); r.exportJSON('session1.json');
 *
 * Header generated from: August Tectangle Sprint/foundation/docs/TECTANGLE_EARS_CANONICAL_2025-08-27T034212Z.md (2025-08-27T03:42:12Z)
 */