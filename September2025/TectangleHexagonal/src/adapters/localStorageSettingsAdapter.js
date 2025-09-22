/*
WEBWAY:ww-2025-101: LocalStorage adapter for hex settings (expires 2025-10-05)
Interface:
- load(appId, version) => Promise<object>
- save(appId, version, data) => Promise<void>
Notes:
- Namespaced by key: `hex:settings:${appId}:v${version}`
- Controlled by flag HEX_SETTINGS_PERSIST (default true). When false, adapter no-ops and returns defaults.
*/

// WEBWAY:ww-2025-101: Boundary-safe: inject flag function instead of importing from app layer

function key(appId, version){ return `hex:settings:${appId}:v${version}`; }

/**
 * Create a settings adapter backed by localStorage.
 * Accepts a boundary-safe injectable flag function to avoid adapter->app imports.
 * @param {Object} [deps]
 * @param {(name:string, fallback:boolean)=>boolean} [deps.flag]
 */
export function createLocalStorageSettingsAdapter({ flag = (_name, fallback) => fallback } = {}) {
  async function load(appId, version){
    if (!flag('HEX_SETTINGS_PERSIST', true)) return {};
    try{
      if (typeof localStorage === 'undefined') return {};
      const raw = localStorage.getItem(key(appId, version));
      if (!raw) return {};
      return JSON.parse(raw);
    }catch{ return {}; }
  }
  async function save(appId, version, data){
    if (!flag('HEX_SETTINGS_PERSIST', true)) return;
    try{
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key(appId, version), JSON.stringify(data||{}));
    }catch{ /* ignore */ }
  }
  return { load, save };
}

export default { createLocalStorageSettingsAdapter };
