/**
 * Canonical manager wiring for Declarative DI + ManagerRegistry runner.
 *
 * Each entry:
 *  { name, module, exportName = "default", args = [], meta = {}, startAfter = [] }
 *
 * Module paths are computed as absolute URLs (via import.meta.url) so dynamic imports
 * performed inside the ManagerRegistry resolve correctly regardless of the page's URL.
 *
 * Use { ref: "ManagerName" } for cross-manager injection in args.
 *
 * Important:
 *  - args entries should be option objects expected by constructors (e.g. { eventBus: { ref: 'EventBusManager' } })
 *  - CameraManager is configured to start after LandmarkSmoothManager to avoid dropping the first frames.
 */

const wiring = [
  {
    name: 'EventBusManager',
    // compute absolute URL relative to this wiring file so ManagerRegistry.import(module) works
    module: new URL('../../src/EventBusManager.js', import.meta.url).href,
    exportName: 'default',
    args: [],
    meta: {},
    startAfter: []
  },
  {
    name: 'LandmarkRawManager',
    module: new URL('../../src/LandmarkRawManager.js', import.meta.url).href,
    exportName: 'default',
    // pass an options object with eventBus injected via ref
    args: [{ eventBus: { ref: 'EventBusManager' } }],
    meta: {},
    startAfter: ['EventBusManager']
  },
  {
    name: 'LandmarkSmoothManager',
    module: new URL('../../src/LandmarkSmoothManager.js', import.meta.url).href,
    exportName: 'default',
    // LandmarkSmoothManager expects an options object (eventBus etc.)
    args: [{ eventBus: { ref: 'EventBusManager' } }],
    meta: {},
    startAfter: ['LandmarkRawManager']
  },
  {
    name: 'CameraManager',
    module: new URL('../../src/CameraManager.js', import.meta.url).href,
    exportName: 'default',
    // CameraManager accepts an options object; eventBus injected for canonical publishing
    args: [{ eventBus: { ref: 'EventBusManager' } }],
    meta: {},
    // Ensure camera starts after smooth manager is subscribed to landmark:raw
    startAfter: ['LandmarkSmoothManager']
  },
  // Optional: PinchRecognitionManager wiring can be added later
];

export default wiring;