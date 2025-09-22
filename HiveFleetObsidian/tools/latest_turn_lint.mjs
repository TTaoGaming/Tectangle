import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const dir = path.join('HiveFleetObsidian','reports','turns');
if(!fs.existsSync(dir)){
  console.error('No turns directory:', dir);
  process.exit(2);
}
const files = fs.readdirSync(dir).filter(n=>/^turn_.*\.json$/.test(n));
if(files.length===0){ console.error('No turn_*.json files in', dir); process.exit(2); }
files.sort((a,b)=> fs.statSync(path.join(dir,b)).mtimeMs - fs.statSync(path.join(dir,a)).mtimeMs);
const latest = path.join(dir, files[0]);
console.log('[Shape] Linting', latest);
const res = spawnSync('node', ['HiveFleetObsidian/tools/response_shape_lint.mjs', latest], { stdio:'inherit' });
process.exit(res.status ?? 0);

