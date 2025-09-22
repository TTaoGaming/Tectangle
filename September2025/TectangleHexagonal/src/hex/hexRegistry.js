/*
WEBWAY:ww-2025-102: Minimal Hex Registry for strangler assimilation (expires 2025-10-06)
Contract:
- registerHexApp(appId, api): stores api and returns dispose()
- getHexApp(appId): returns api or null
- listHexApps(): returns array of { appId }
*/

const _apps = new Map();

export function registerHexApp(appId, api) {
  if (!appId) throw new Error('registerHexApp requires appId');
  _apps.set(appId, api);
  try { if (typeof window !== 'undefined') { window.__hex = window.__hex || {}; window.__hex[appId] = api; } } catch {}
  return () => {
    _apps.delete(appId);
    try { if (typeof window !== 'undefined' && window.__hex) delete window.__hex[appId]; } catch {}
  };
}

export function getHexApp(appId) { return _apps.get(appId) || null; }
export function listHexApps() { return Array.from(_apps.keys()).map(appId => ({ appId })); }

export default { registerHexApp, getHexApp, listHexApps };
