// Feature Flags Port
// Purpose: Provide controllers and other non-app layers a safe way to read flags
// without depending on the app layer. Mirrors the simple behavior used in app/featureFlags.

export function flag(name, fallback = false) {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.__flags && name in globalThis.__flags) {
      return !!globalThis.__flags[name];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && name in process.env) {
      const v = process.env[name];
      return v === '1' || v === 'true' || v === 'on';
    }
  } catch {}
  return fallback;
}
