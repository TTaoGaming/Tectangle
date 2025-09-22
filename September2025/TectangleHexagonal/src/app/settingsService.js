/*
WEBWAY:ww-2025-101: Hex settings port + service (expires 2025-10-05)
Contract:
- createSettingsService({ appId, version, adapter }) returns service with:
  - load(): Promise<object>
  - save(patch: object): Promise<object>
  - getAll(): object
  - get(keyPath: string, fallback?: any): any
  - set(keyPath: string, value: any): object
Notes:
- Adapter interface: { load(appId, version) => Promise<object>, save(appId, version, data) => Promise<void> }
- KeyPath uses dot notation (e.g., 'seat.claimCooldownMs').
*/

function getByPath(obj, path, fallback) {
  if (!obj || !path) return fallback;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
    else return fallback;
  }
  return cur;
}

function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
  return obj;
}

export function createSettingsService({ appId, version = 1, adapter, defaults = {} } = {}) {
  if (!appId) throw new Error('settingsService requires appId');
  if (!adapter || typeof adapter.load !== 'function' || typeof adapter.save !== 'function') {
    throw new Error('settingsService requires adapter with load/save');
  }
  let cache = { ...defaults };
  let loaded = false;

  async function load() {
    try {
      const data = await adapter.load(appId, version);
      if (data && typeof data === 'object') {
        cache = { ...defaults, ...data };
      } else {
        cache = { ...defaults };
      }
    } catch {
      cache = { ...defaults };
    }
    loaded = true;
    return { ...cache };
  }

  async function save(patch = {}) {
    const next = { ...cache, ...patch };
    cache = next;
    try {
      await adapter.save(appId, version, next);
    } catch { /* ignore storage errors */ }
    return { ...cache };
  }

  function getAll() { return { ...cache }; }
  function get(path, fallback) { return getByPath(cache, path, fallback); }
  function set(path, value) { cache = setByPath({ ...cache }, path, value); return { ...cache }; }

  return { load, save, getAll, get, set };
}

export default { createSettingsService };
