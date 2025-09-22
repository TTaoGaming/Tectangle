// Evaporate marks that have decayed. Move them to marks/expired.
// Usage: node HiveFleetObsidian/tools/marks_evaporate.mjs

import fs from 'node:fs';
import path from 'node:path';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const active = path.join(base,'marks','active');
const expired = path.join(base,'marks','expired');
fs.mkdirSync(active,{ recursive:true });
fs.mkdirSync(expired,{ recursive:true });

const now = Date.now();
for (const f of fs.readdirSync(active)){
  const p = path.join(active,f);
  if (!/\.json$/i.test(f)) continue;
  try{
    const rec = JSON.parse(fs.readFileSync(p,'utf8'));
    const born = Date.parse(rec.ts||'');
    const life = (rec.decay_after_minutes||120)*60000;
    if (!isNaN(born) && now-born > life){
      fs.renameSync(p, path.join(expired, f));
      console.log('[evaporate] moved', f);
    }
  }catch{}
}
