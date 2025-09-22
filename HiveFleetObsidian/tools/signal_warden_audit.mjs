// Signal Warden: safety defaults + telemetry integrity audit (static)
// Usage: node HiveFleetObsidian/tools/signal_warden_audit.mjs [--config path]

import fs from 'node:fs';

function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const cfg = arg('config','');
let config = {};
if (cfg && fs.existsSync(cfg)){
  try { config = JSON.parse(fs.readFileSync(cfg,'utf8')); } catch {}
}
const checks = [
  { key:'telemetryOptIn', ok: config.telemetryOptIn !== false, note:'opt-in preferred' },
  { key:'privacyConsent', ok: !!config.privacyConsent, note:'explicit consent flag' },
  { key:'failClosed', ok: config.failClosed !== false, note:'default to fail-closed' },
];
const pass = checks.every(c=>c.ok);
console.log(JSON.stringify({ audit: { pass, checks } }, null, 2));

