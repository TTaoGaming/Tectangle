# Manager Interface Specification

Version: 2025-09-07

Summary

This document defines the canonical Manager interface, header/meta conventions, lifecycle methods, event envelope conventions, telemetry hooks, and test requirements for managers used across the Tectangle project (CameraManager, LandmarkRawManager, LandmarkSmoothManager, EventBusManager, etc.).

Goals

- Deterministic lifecycle: avoid import-time side effects.
- Strongly-typed event envelopes and AJV schemas.
- Simple registration and discovery (ManagerRegistry / window.__MANAGERS__).
- Telemetry and diagnostics hooks for smoke harness and CI.

Scope

- Applies to all runtime managers implemented under /src and /prototype.
- Does not prescribe language (JS/TS/py) but defines behavior and envelope contracts.

Manager header / meta (sidecar)

Each manager SHOULD ship a lightweight sidecar JSON meta file next to the implementation: <manager>.meta.json

Example: CameraManager.meta.json

```json
{
  "name": "CameraManager",
  "version": "0.1.0",
  "author": "team",
  "description": "Deterministic browser camera manager with synthetic mode and frame envelope emission.",
  "lifecycle": ["start","stop","diagnostics"],
  "events": {
    "camera:params": "object",
    "camera:frame": "object"
  },
  "schema_files": {
    "camera:params": "schemas/camera.params.schema.json",
    "camera:frame": "schemas/camera.frame.schema.json"
  },
  "telemetry": ["frames_emitted","errors","synthetic_runs"]
}
```

Placement

- Put meta file next to implementation: e.g., `src/CameraManager.meta.json`.

Manager lifecycle (behavior)

- Managers must avoid side effects at import time.
- Managers expose explicit lifecycle methods:
  - start(config): Promise<void>
  - stop(): Promise<void>
  - diagnostics(): object
  - getMeta(): object
- Managers register to the ManagerRegistry when started and deregister on stop.

Generic Manager interface (TypeScript)

```ts
export interface ManagerConfig {
  env?: 'dev' | 'test' | 'prod';
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  [key: string]: any;
}

export interface EventEnvelope {
  type: string;
  timestamp: string; // ISO 8601
  payload: any;
  meta?: Record<string, any>;
}

export interface Manager {
  start(config?: ManagerConfig): Promise<void>;
  stop(): Promise<void>;
  on(event: string, handler: (envelope: EventEnvelope) => void): void;
  off(event: string, handler?: (envelope: EventEnvelope) => void): void;
  emit(event: string, envelope: EventEnvelope): void;
  getMeta(): object;
  diagnostics(): object;
}
```

ManagerRegistry (discovery)

- A minimal ManagerRegistry must be available to prototypes and smoke harnesses.
- Implementation: lightweight in-memory registry that can be exposed on `window.__MANAGERS__` in browser prototypes.

Registry API example

```js
const ManagerRegistry = {
  register(name, instance) { /* ... */ },
  deregister(name) { /* ... */ },
  get(name) { /* ... */ },
  list() { /* ... */ }
};
window.__MANAGERS__ = ManagerRegistry;
```

Event envelope conventions

- All envelopes MUST include:
  - type: string (event name)
  - timestamp: ISO 8601 string
  - payload: object (structured data)
  - meta: optional object (source, trace_id, seq)

Example camera:frame envelope

```json
{
  "type": "camera:frame",
  "timestamp": "2025-09-07T10:00:00.000Z",
  "payload": {
    "frameId": 1234,
    "width": 1280,
    "height": 720,
    "landmarks": [ /* optional if frame contains precomputed landmarks */ ],
    "rawImageRef": null
  },
  "meta": {
    "cameraId": "builtin",
    "fps": 30,
    "traceId": "golden-xxxx"
  }
}
```

JSON Schema / AJV

- Add small Ajv schema files under `schemas/` for runtime validation.
- Schema filenames should be referenced in meta `schema_files`.

Example `schemas/camera.frame.schema.json` (summary)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["type","timestamp","payload"],
  "properties": {
    "type": { "const": "camera:frame" },
    "timestamp": { "type": "string", "format": "date-time" },
    "payload": {
      "type": "object",
      "required": ["frameId","width","height"],
      "properties": {
        "frameId": { "type": "integer" },
        "width": { "type": "integer" },
        "height": { "type": "integer" },
        "landmarks": { "type": "array" }
      }
    },
    "meta": { "type": "object" }
  }
}
```

Telemetry and diagnostics

- Managers MUST expose counters and basic diagnostics for the smoke harness:
  - frames_emitted
  - errors
  - synthetic_runs
- diagnostics() should return snapshot: { counters: {...}, lastError: {...}, uptimeMs: number }

Telemetry adapter pattern

- Accept a pluggable telemetry adapter in config (noop in dev by default).
- Adapter interface: { incr(metric, value = 1), gauge(name, value), event(name, payload) }

CI header & schema checks

- CI job must validate each manager's meta file and referenced schema files (AJV validate the sidecar).
- The header-check workflow should fail PRs that modify managers without a valid meta or schema.

Smoke harness integration

- The smoke harness (local and CI) will:
  1. Start ManagerRegistry and ensure `window.__MANAGERS__` is available in prototypes.
  2. Start CameraManager in synthetic replay mode with a golden JSONL trace.
  3. Subscribe to `camera:frame` and assert AJV validation and expected counters.

Example startup flow for prototype

```js
import { ManagerRegistry } from './prototype/common/manager-bootstrap.js';
import { CameraManager } from './src/CameraManager.js';

const cam = new CameraManager();
await cam.start({ syntheticTrace: 'prototype/landmark-smooth/golden/pinch_01.jsonl' });
ManagerRegistry.register('CameraManager', cam);
```

Tests and TDD checklist

- Unit tests:
  - meta file exists and matches shape
  - AJV schema validates sample envelopes
  - start() and stop() resolve and manage resources

- Integration / smoke:
  - Replay golden JSONL and assert counters and emitted events
  - Expose diagnostics snapshot for assert in CI

Backwards compatibility / migration notes

- If a manager currently performs import-time side effects, create a thin bootstrap shim that keeps current behavior while refactoring (adapter pattern).
- Add deprecation note in meta with `deprecatedBy` field and timeline.

Implementation checklist (next dev tasks)

- [ ] Add `src/<Manager>.meta.json` for each manager.
- [ ] Add AJV schemas under `schemas/`.
- [ ] Refactor managers to implement the Manager interface (start/stop/on/off/emit/diagnostics).
- [ ] Add ManagerRegistry and expose `window.__MANAGERS__` in prototypes.
- [ ] Add CI header-check and AJV validation job.
- [ ] Extract 2s golden windows into `prototype/landmark-smooth/golden/`.

References

- Deep dive: [`docs/deepdives/DeepDive_CameraManager_20250907.md:1`](docs/deepdives/DeepDive_CameraManager_20250907.md:1)
- Prototype modular camera manager: [`September2025/Tectangle/prototype/landmark-smooth/modular-index/src/camera-manager.js:1`](September2025/Tectangle/prototype/landmark-smooth/modular-index/src/camera-manager.js:1)
- Golden master checklist: [`August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/tectangle_golden_master_checklist_2025-08-30T052336Z.md:44`](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/tectangle_golden_master_checklist_2025-08-30T052336Z.md:44)

End of Manager Interface Specification