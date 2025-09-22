/**
 * TLDR: ManagerRegistry — Central registry for canonical manager singletons (name → instance + metadata). Default runtime target: 480p @ 30FPS.
 *
 * Executive summary (5W1H):
 *  - Who: All managers in the Tectangle pipeline (CameraManager, LandmarkRawManager, LandmarkSmoothManager, KinematicClampManager, PinchRecognitionManager, etc.).
 *  - What: Provide a tiny, dependable registry that records manager instances and metadata (EARS IDs, UI_METADATA) and enables lookup/inspection.
 *  - When: Used at runtime when managers initialize and during diagnostics/watchdog checks and CI tests.
 *  - Where: Imported by EventBus/Watchdog/UI and any module that needs a canonical manager reference.
 *  - Why: Prevent ad-hoc "new" calls, make singletons discoverable, and enable contract checks by WatchdogManager and tests.
 *  - How: Managers call registry.register(name, instance, meta) during init; other modules call registry.get(name) to obtain canonical instance.
 *
 * Top 3 immediate responsibilities:
 *  - Provide reliable register/unregister/get/has/list APIs for manager singletons.
 *  - Store small metadata blobs (EARS ids, UI_METADATA) to enable automatic UI population.
 *  - Be minimal and dependency-free so it is safe for tests, CI and runtime.
 *
 * API summary:
 *  - register(name:string, instance:any, meta:Object = {}) -> instance
 *  - unregister(name:string) -> boolean
 *  - get(name:string) -> instance|null
 *  - getMeta(name:string) -> meta|null
 *  - has(name:string) -> boolean
 *  - list() -> string[]
 *
 * Test protocol summary:
 *  - Unit: register mock instances and assert registry.get/has/list/getMeta/unregister behave as expected.
 *  - Exact asserts: registry.get(name) returns identical instance; getMeta(name) returns supplied meta object.
 *
 * EARS Acceptance Criteria:
 *  - TREQ-REG-001 — When registry.register(name, instance, meta) is invoked, the system shall retain and return the same instance for subsequent registry.get(name).
 *  - TREQ-REG-002 — When metadata is provided at registration, the system shall expose that metadata via registry.getMeta(name).
 *  - TREQ-REG-003 — When registry.unregister(name) is invoked, the system shall remove the entry so that registry.has(name) returns false and list() no longer includes the name.
 *
 * UI_METADATA:
 *  { tabId: 'registry', title: 'Manager Registry', order: 99 }
 *
 * Usage snippet:
 *  // import registry from './ManagerRegistry.js';
 *  // registry.register('CameraManager', cameraMgrInstance, { EARS: 'TREQ-110', UI_METADATA:{tabId:'camera'} });
 */
 
 /* ManagerRegistry — minimal implementation (auto-implemented)
    Keep header comments above as-is (do not remove documentation).
 */
 
 const _map = new Map();
 
 /**
  * Register a manager instance with optional metadata.
  * Returns the instance for convenience.
  */
 export function register(name, instance, meta = {}) {
   const key = String(name);
   _map.set(key, { instance, meta });
   return instance;
 }
 
 /**
  * Unregister a manager by name.
  * Returns true if an entry was removed.
  */
 export function unregister(name) {
   return _map.delete(String(name));
 }
 
 /**
  * Get the registered instance for name, or null.
  */
 export function get(name) {
   const e = _map.get(String(name));
   return e ? e.instance : null;
 }
 
 /**
  * Get metadata object for a registered name or null.
  */
 export function getMeta(name) {
   const e = _map.get(String(name));
   return e ? e.meta : null;
 }
 
 /**
  * Boolean: is name registered?
  */
 export function has(name) {
   return _map.has(String(name));
 }
 
 /**
  * List registered names (string array).
  */
 export function list() {
   return Array.from(_map.keys());
 }
 
 // --- New features: factories, creation, wiring and lifecycle runner ---
 
 // Factories stored by name (name -> factory function)
 const _factories = new Map();
 
 // Wiring metadata storage (keeps original input order)
 const _wiringArray = [];
 const _wiringMap = new Map();
 
 /**
  * Register a factory for later instantiation.
  * @param {string} name
  * @param {Function} factoryFn
  */
 export function registerFactory(name, factoryFn) {
   const key = String(name);
   _factories.set(key, factoryFn);
   return factoryFn;
 }
 
 /**
  * Resolve an argument; supports:
  *  - string "ref:ManagerName" -> substitute registry.get("ManagerName")
  *  - object { ref: "ManagerName" } -> substitute registry.get("ManagerName")
  *  - otherwise -> return as-is
  * @private
  */
 function _resolveArg(arg) {
   if (typeof arg === 'string' && arg.startsWith('ref:')) {
     const refName = arg.slice(4);
     return get(refName);
   }
   if (arg && typeof arg === 'object' && typeof arg.ref === 'string') {
     return get(arg.ref);
   }
   return arg;
 }
 
 /**
  * Instantiate using a registered factory.
  *
  * create(name, { args = [], meta = {} } = {})
  *
  * @param {string} name
  * @param {object} options
  * @param {Array} options.args
  * @param {object} options.meta
  * @returns {Promise<any>} created instance (also registered)
  */
 export async function create(name, { args = [], meta = {} } = {}) {
   const key = String(name);
   const factory = _factories.get(key);
   if (!factory) {
     throw new Error(`No factory registered for "${name}"`);
   }
   const resolvedArgs = await Promise.all((args || []).map((a) => Promise.resolve(_resolveArg(a))));
   // Allow factory to be sync or async
   const result = factory(...resolvedArgs);
   const instance = result && typeof result.then === 'function' ? await result : result;
   register(key, instance, meta);
   return instance;
 }
 
 /**
  * Helper: instantiate an exported constructor/factory.
  * Tries `new Export(...args)` first; if that throws, tries `Export(...args)`.
  * Awaits if result is a Promise.
  * @private
  */
 async function _instantiateExport(exported, resolvedArgs) {
   // If the module exported a ready-made instance (non-function), return it directly.
   if (typeof exported !== 'function') {
     return exported;
   }
   let instance;
   try {
     // attempt as constructor first
     instance = new exported(...resolvedArgs);
   } catch (err) {
     // fallback as factory function
     instance = exported(...resolvedArgs);
   }
   if (instance && typeof instance.then === 'function') {
     instance = await instance;
   }
   return instance;
 }
 
 /**
  * createAllFromWiring(wiringArray)
  *
  * wiring entry:
  *  { name, module, exportName = "default", args = [], meta = {}, startAfter = [] }
  *
  * - dynamic-imports the module
  * - picks export (default or named)
  * - instantiates (new Export(...args) || Export(...args)); awaits async results
  * - registers instance and stores wiring metadata for runLifecycle
  *
  * Returns: { created: [names], wiringMap }
  */
 export async function createAllFromWiring(wiringArray) {
   if (!Array.isArray(wiringArray)) {
     throw new Error('wiringArray must be an array');
   }
 
   // Reset internal wiring state and preserve ordering from this invocation
   _wiringArray.length = 0;
   _wiringMap.clear();
 
   const created = [];
   for (let i = 0; i < wiringArray.length; i += 1) {
     const entry = wiringArray[i];
     const {
       name,
       module,
       exportName = 'default',
       args = [],
       meta = {},
       startAfter = [],
     } = entry;
     if (!name || !module) {
       throw new Error(`Invalid wiring entry at index ${i}: missing name or module`);
     }
     // dynamic import
     const imported = await import(module);
     const exported = exportName === 'default' ? imported.default : imported[exportName];
     if (typeof exported === 'undefined') {
       throw new Error(`Module "${module}" did not export "${exportName}"`);
     }
     // Resolve args (supports ref: convention)
     const resolvedArgs = await Promise.all((args || []).map((a) => Promise.resolve(_resolveArg(a))));
     // Instantiate
     const instance = await _instantiateExport(exported, resolvedArgs);
     // Register instance
     register(String(name), instance, meta);
     // Store wiring metadata
     const wiringMeta = {
       name: String(name),
       module,
       exportName,
       args: Array.isArray(args) ? args.slice() : [],
       meta: Object.assign({}, meta),
       startAfter: Array.isArray(startAfter) ? startAfter.slice() : [],
       index: i,
     };
     _wiringArray.push(wiringMeta);
     _wiringMap.set(String(name), wiringMeta);
     created.push(String(name));
   }
 
   const wiringMapObj = {};
   for (const [k, v] of _wiringMap.entries()) {
     wiringMapObj[k] = v;
   }
 
   return { created, wiringMap: wiringMapObj };
 }
 
 /**
  * runLifecycle(action = "start", options = {})
  *
  * - Determines order:
  *   * options.order -> use that
  *   * otherwise try to topo-sort based on wiring startAfter and fallback to wiring input order on cycles
  *   * if no wiring information, fallback to registry.list()
  * - Calls instance[action]() sequentially (awaits) and collects results/errors
  * - Returns: { ok: boolean, results: { name: { ok: true|false, err?: string } } }
  */
 export async function runLifecycle(action = 'start', options = {}) {
   const results = {};
   let order = [];
 
   if (Array.isArray(options.order) && options.order.length) {
     order = options.order.slice();
   } else if (_wiringArray.length) {
     // Build adjacency & indegree for Kahn's algorithm
     const adj = new Map(); // name -> Set(successors)
     const indegree = new Map();
     // initialize
     for (const w of _wiringArray) {
       adj.set(w.name, new Set());
       indegree.set(w.name, 0);
     }
     // edges from dependency -> dependent
     for (const w of _wiringArray) {
       for (const dep of (w.startAfter || [])) {
         if (!adj.has(dep)) {
           // ensure external deps are present as placeholders
           adj.set(dep, new Set());
           indegree.set(dep, indegree.get(dep) || 0);
         }
         adj.get(dep).add(w.name);
         indegree.set(w.name, (indegree.get(w.name) || 0) + 1);
       }
     }
     // seed queue with nodes indegree 0 in wiring input order
     const queue = [];
     for (const w of _wiringArray) {
       if ((indegree.get(w.name) || 0) === 0) queue.push(w.name);
     }
     const ordered = [];
     while (queue.length) {
       const n = queue.shift();
       ordered.push(n);
       const succs = adj.get(n) || new Set();
       for (const s of succs) {
         indegree.set(s, indegree.get(s) - 1);
         if (indegree.get(s) === 0) queue.push(s);
       }
     }
     const allNodes = Array.from(new Set(_wiringArray.map((w) => w.name)));
     if (ordered.length !== allNodes.length) {
       // cycle detected; fallback to input order
       order = allNodes.slice();
     } else {
       order = ordered;
     }
   } else {
     // fallback to registry listing
     order = list();
   }
 
   let ok = true;
   for (const name of order) {
     const instance = get(name);
     if (!instance) {
       results[name] = { ok: false, err: `No instance registered for ${name}` };
       ok = false;
       continue;
     }
     const fn = instance[action];
     if (typeof fn === 'function') {
       try {
         // allow lifecycle methods to accept options or not; we call without args (user may ignore)
         await fn.call(instance, options);
         results[name] = { ok: true };
       } catch (err) {
         results[name] = { ok: false, err: err && err.stack ? err.stack : String(err) };
         ok = false;
       }
     } else {
       // treat missing method as a non-fatal success
       results[name] = { ok: true, info: `No ${action}() method` };
     }
   }
 
   return { ok, results };
 }
 
 /**
  * clear() — resets registry/factories/wiring (for test isolation)
  */
 export function clear() {
   _map.clear();
   _factories.clear();
   _wiringArray.length = 0;
   _wiringMap.clear();
 }
 
 /**
  * entries() / getAll() — diagnostic list of registered records
  * returns array [{ name, instance, meta }]
  */
 export function entries() {
   const out = [];
   for (const [name, { instance, meta }] of _map.entries()) {
     out.push({ name, instance, meta });
   }
   return out;
 }
 export function getAll() {
   return entries();
 }
 
 /**
  * Default export — include legacy API + new helpers for backwards compatibility.
  */
 export default {
   register,
   unregister,
   get,
   getMeta,
   has,
   list,
   registerFactory,
   create,
   createAllFromWiring,
   runLifecycle,
   clear,
   entries,
   getAll,
 };