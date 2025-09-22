/*
STIGMERGY REVIEW HEADER
Status: Draft
Review started: 2025-09-16T21:05-06:00
Expires: 2025-09-23T21:05-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Verify dependent modules and update factorization notes
 - [ ] Log decisions in TODO_2025-09-16.md
*/

// Game profile registry: allows pluggable macro profiles that translate gesture events into game actions.
// Profiles are small configuration objects (JSON-friendly) or factory functions that can be swapped per demo/game.

const registry = new Map();

function assertProfileDef(def){
  if(!def || typeof def !== 'object') throw new Error('game profile definition must be an object');
  if(typeof def.id !== 'string' || !def.id.trim()) throw new Error('game profile definition requires an id');
  if(typeof def.factory !== 'function') throw new Error('game profile definition requires a factory(params)');
}

function deepClone(obj){
  if(obj == null) return obj;
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}

function normalizeInstance(baseMeta, instance){
  const profile = Object.assign({
    id: baseMeta.id,
    label: baseMeta.label || baseMeta.id,
    version: baseMeta.version || '0.1.0',
    description: baseMeta.description || '',
    source: baseMeta.source || 'registry',
    params: instance?.params || {},
    telemetry: instance?.telemetry || null,
  }, deepClone(instance || {}));
  if(!Array.isArray(profile.rules)) profile.rules = [];
  profile.rules = profile.rules.map((rule, idx) => {
    const r = deepClone(rule || {});
    if(typeof r.id !== 'string' || !r.id) r.id = `${profile.id}:rule-${idx}`;
    if(r.when == null) r.when = { type: 'pinch:down' };
    if(Array.isArray(r.emit)) r.emit = r.emit.map(e => deepClone(e));
    else if(typeof r.emit === 'function') {
      // leave functions as-is; caller must ensure serializable if needed
    } else if(r.emit != null) {
      r.emit = [deepClone(r.emit)];
    } else {
      r.emit = [];
    }
    return r;
  });
  return profile;
}

function instantiate(id, params){
  const meta = registry.get(id);
  if(!meta) throw new Error(`Unknown game profile: ${id}`);
  const mergedParams = Object.assign({}, deepClone(meta.defaults || {}), params || {});
  const instance = meta.factory(mergedParams) || {};
  if(!instance.params) instance.params = mergedParams;
  return normalizeInstance(meta, instance);
}

export function registerGameProfile(def){
  assertProfileDef(def);
  const stored = {
    id: def.id,
    label: def.label || def.id,
    version: def.version || '0.1.0',
    description: def.description || '',
    source: def.source || 'registry',
    defaults: deepClone(def.defaults || {}),
    factory: def.factory,
  };
  registry.set(stored.id, stored);
  return stored.id;
}

export function hasGameProfile(id){
  return registry.has(id);
}

export function listGameProfiles(){
  return Array.from(registry.values()).map(meta => ({
    id: meta.id,
    label: meta.label,
    version: meta.version,
    description: meta.description,
    source: meta.source,
    defaults: deepClone(meta.defaults || {}),
  }));
}

export function loadGameProfile(request){
  if(!request){
    return instantiate('legacy-primary');
  }
  if(typeof request === 'string'){
    return instantiate(request);
  }
  if(typeof request === 'object'){
    if(Array.isArray(request.rules)){
      return normalizeInstance({ id: request.id || 'ad-hoc', label: request.label || (request.id || 'ad-hoc'), version: request.version || '0.1.0', description: request.description || '', source: request.source || 'inline' }, request);
    }
    const target = request.use || request.id || 'legacy-primary';
    const params = Object.assign({}, request.defaults || {}, request.params || {}, request.options || {});
    const instance = instantiate(target, params);
    if(request.label) instance.label = request.label;
    if(request.description) instance.description = request.description;
    if(request.version) instance.version = request.version;
    if(request.telemetry) instance.telemetry = request.telemetry;
    if(request.rules) instance.rules = Array.isArray(request.rules) ? request.rules : instance.rules;
    return instance;
  }
  return instantiate('legacy-primary');
}

// Built-in profiles
registerGameProfile({
  id: 'legacy-primary',
  label: 'Legacy Primary Button',
  description: 'Maintains historical BTN_PRIMARY / BTN_RELEASE mapping for backward compatibility.',
  version: '2025.09.16',
  defaults: {},
  factory(){
    return {
      rules: [
        {
          id: 'legacy-primary-down',
          when: { type: 'pinch:down' },
          emit: [{ action: 'BTN_PRIMARY' }],
        },
        {
          id: 'legacy-primary-up',
          when: { type: 'pinch:up' },
          emit: [{ action: 'BTN_RELEASE' }],
        }
      ]
    };
  }
});

registerGameProfile({
  id: 'single-key',
  label: 'Pinch -> Single Key',
  description: 'Maps pinch down/up to a configurable keyboard key payload.',
  version: '2025.09.16',
  defaults: { key: 'KeyA', keyLabel: 'A', downPayload: null, upPayload: null },
  factory(params){
    const key = params.key || 'KeyA';
    const keyLabel = params.keyLabel || key;
    return {
      rules: [
        {
          id: 'single-key-down',
          when: { type: 'pinch:down' },
          emit: [{ action: 'KEY_DOWN', payload: { key, keyLabel, mode: 'down', extra: params.downPayload || null } }],
        },
        {
          id: 'single-key-up',
          when: { type: 'pinch:up' },
          emit: [{ action: 'KEY_UP', payload: { key, keyLabel, mode: 'up', extra: params.upPayload || null } }],
        }
      ],
      params: { key, keyLabel },
      telemetry: { counters: ['pinchDown', 'pinchUp'] }
    };
  }
});

registerGameProfile({
  id: 'seat-multiplex',
  label: 'Seat Multiplex Buttons',
  description: 'Derives distinct actions per seat so multiple players can map to unique buttons.',
  version: '2025.09.16',
  defaults: { seatActions: { P1: { down: 'P1_DOWN', up: 'P1_UP' }, P2: { down: 'P2_DOWN', up: 'P2_UP' } }, fallback: { down: 'BTN_PRIMARY', up: 'BTN_RELEASE' } },
  factory(params){
    const seatActions = params.seatActions || {};
    const fallback = params.fallback || { down: 'BTN_PRIMARY', up: 'BTN_RELEASE' };
    function actionFor(seat, phase){
      return seatActions[seat]?.[phase] || fallback[phase];
    }
    return {
      rules: [
        {
          id: 'seat-down',
          when: { type: 'pinch:down' },
          emit: evt => [{ action: actionFor(evt.seat || null, 'down') }],
        },
        {
          id: 'seat-up',
          when: { type: 'pinch:up' },
          emit: evt => [{ action: actionFor(evt.seat || null, 'up') }],
        }
      ],
      params: { seatActions, fallback },
      telemetry: { histograms: ['seatUsage'] }
    };
  }
});

export function resetGameProfileRegistry(){
  // Testing utility: clear and re-register built-ins
  registry.clear();
  registerGameProfile({
    id: 'legacy-primary',
    label: 'Legacy Primary Button',
    description: 'Maintains historical BTN_PRIMARY / BTN_RELEASE mapping for backward compatibility.',
    version: '2025.09.16',
    defaults: {},
    factory(){
      return {
        rules: [
          { id: 'legacy-primary-down', when: { type: 'pinch:down' }, emit: [{ action: 'BTN_PRIMARY' }] },
          { id: 'legacy-primary-up', when: { type: 'pinch:up' }, emit: [{ action: 'BTN_RELEASE' }] }
        ]
      };
    }
  });
  registerGameProfile({
    id: 'single-key',
    label: 'Pinch -> Single Key',
    description: 'Maps pinch down/up to a configurable keyboard key payload.',
    version: '2025.09.16',
    defaults: { key: 'KeyA', keyLabel: 'A', downPayload: null, upPayload: null },
    factory(params){
      const key = params.key || 'KeyA';
      const keyLabel = params.keyLabel || key;
      return {
        rules: [
          { id: 'single-key-down', when: { type: 'pinch:down' }, emit: [{ action: 'KEY_DOWN', payload: { key, keyLabel, mode: 'down', extra: params.downPayload || null } }] },
          { id: 'single-key-up', when: { type: 'pinch:up' }, emit: [{ action: 'KEY_UP', payload: { key, keyLabel, mode: 'up', extra: params.upPayload || null } }] }
        ],
        params: { key, keyLabel },
        telemetry: { counters: ['pinchDown', 'pinchUp'] }
      };
    }
  });
  registerGameProfile({
    id: 'seat-multiplex',
    label: 'Seat Multiplex Buttons',
    description: 'Derives distinct actions per seat so multiple players can map to unique buttons.',
    version: '2025.09.16',
    defaults: { seatActions: { P1: { down: 'P1_DOWN', up: 'P1_UP' }, P2: { down: 'P2_DOWN', up: 'P2_UP' } }, fallback: { down: 'BTN_PRIMARY', up: 'BTN_RELEASE' } },
    factory(params){
      const seatActions = params.seatActions || {};
      const fallback = params.fallback || { down: 'BTN_PRIMARY', up: 'BTN_RELEASE' };
      const actionFor = (seat, phase) => seatActions[seat]?.[phase] || fallback[phase];
      return {
        rules: [
          { id: 'seat-down', when: { type: 'pinch:down' }, emit: evt => [{ action: actionFor(evt.seat || null, 'down') }] },
          { id: 'seat-up', when: { type: 'pinch:up' }, emit: evt => [{ action: actionFor(evt.seat || null, 'up') }] }
        ],
        params: { seatActions, fallback },
        telemetry: { histograms: ['seatUsage'] }
      };
    }
  });
}
