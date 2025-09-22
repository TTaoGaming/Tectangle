// Safebreaker: temporary, flagged bypass to unblock safely
// Usage: node HiveFleetObsidian/tools/safebreaker_pivot.mjs --flag NAME --enable|--disable --note "why" --timebox "2h"

import fs from 'node:fs';

function has(x){ return process.argv.includes(x); }
function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const flag = arg('flag','SAFE_MODE');
const note = arg('note','temporary bypass');
const timebox = arg('timebox','2h');
const enable = has('--enable');
const disable = has('--disable');

const action = enable ? 'enable' : disable ? 'disable' : 'plan';
const manifest = { flag, action, note, timebox, ts: new Date().toISOString() };
fs.mkdirSync('HiveFleetObsidian/tmp', { recursive:true });
fs.writeFileSync('HiveFleetObsidian/tmp/safebreaker_manifest.json', JSON.stringify(manifest, null, 2));
console.log('[Safebreaker] ', manifest);

