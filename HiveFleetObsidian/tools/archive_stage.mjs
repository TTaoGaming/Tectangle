// Archive staging (non-destructive)
// Usage: node HiveFleetObsidian/tools/archive_stage.mjs [--apply] [--min-days 0]
// Moves proposed archive candidates (from hive_health) to archive-candidate/ with manifest.
// Reversible: creates restore script hints.

import fs from 'node:fs';
import path from 'node:path';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const toolsDir = path.join(base,'tools');
const analysisDir = path.join(base,'analysis');
const stageDir = path.join(base,'archive-candidate');

function latestInventory(){
  if(!fs.existsSync(analysisDir)) return null;
  const files = fs.readdirSync(analysisDir).filter(f=>/^tool_inventory_.*\.json$/.test(f)).map(f=>path.join(analysisDir,f));
  if(!files.length) return null;
  files.sort((a,b)=> fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  try { return JSON.parse(fs.readFileSync(files[0],'utf8')); } catch { return null; }
}

const inv = latestInventory();
if(!inv){ console.error('[archive_stage] No inventory found. Run hive:health first.'); process.exit(2); }
const candidates = inv.archive_candidates || [];

const apply = process.argv.includes('--apply');
fs.mkdirSync(stageDir,{ recursive:true });

const manifestPath = path.join(stageDir,'manifest.json');
let manifest = [];
try { manifest = JSON.parse(fs.readFileSync(manifestPath,'utf8')); } catch {}

const actions = [];
for (const c of candidates){
  const src = path.join(toolsDir, c.file);
  if(!fs.existsSync(src)) continue;
  const dest = path.join(stageDir, c.file);
  actions.push({ file: c.file, from: src, to: dest });
  if(apply){
    if(!fs.existsSync(dest)) fs.renameSync(src, dest);
    manifest.push({ file: c.file, staged_at: new Date().toISOString(), original: src });
  }
}
if(apply){ fs.writeFileSync(manifestPath, JSON.stringify(manifest,null,2)); }
console.log(JSON.stringify({ apply, count: actions.length, actions }, null, 2));
