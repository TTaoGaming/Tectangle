// Verify that each champion has docs seeded (persona, summon, canon)
// Usage: node HiveFleetObsidian/tools/champions_verify_docs.mjs

import fs from 'node:fs';
import path from 'node:path';
import { champions } from './champion_registry.mjs';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';

let missing = 0;
for (const c of champions) {
  const dir = path.join(base, 'honeycomb', 'champions', c.pascal, 'docs');
  const files = ['persona.md', 'summon.md', 'canon.md'];
  for (const f of files) {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) {
      console.error(`[HFO] Missing champion doc: ${c.pascal}/docs/${f}`);
      missing++;
    }
  }
}

if (missing > 0) {
  console.error(`\n[HFO] Champion docs verification FAILED (${missing} missing file(s))`);
  process.exit(1);
}

console.log('[HFO] Champion docs verification OK');

