// Validate Open_Palm idle summary JSON
// Usage: node validate_open_palm_summary.mjs <summary.json>
import fs from 'node:fs/promises';

const path = process.argv[2] || process.env.SUMMARY;
if(!path){ console.error('[validate] Missing summary path'); process.exit(2); }

const raw = await fs.readFile(path, 'utf8').catch(()=>null);
if(!raw){ console.error('[validate] Cannot read summary:', path); process.exit(2); }
let data; try{ data = JSON.parse(raw); }catch(e){ console.error('[validate] JSON parse error:', e.message); process.exit(2); }

function fail(msg){ console.error('[validate:fail]', msg); process.exit(1); }
function ok(msg){ console.log('[validate:ok]', msg); }

if(!data || typeof data !== 'object') fail('summary not an object');
if(!data.assertions) fail('missing assertions');
const { twoHandsAny, openPalmLeftAny, openPalmRightAny } = data.assertions;
if(!twoHandsAny) fail('twoHandsAny=false');
if(!openPalmLeftAny) fail('openPalmLeftAny=false');
if(!openPalmRightAny) fail('openPalmRightAny=false');

ok('assertions passed');

// Optional: basic sanity on seconds fields
const ls = data.openPalm?.left?.seconds ?? 0;
const rs = data.openPalm?.right?.seconds ?? 0;
if(ls <= 0 || rs <= 0){ console.warn('[validate:warn] zero seconds detected (may be acceptable for very short clips)'); }
