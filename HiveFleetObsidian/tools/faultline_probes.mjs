// Faultline Seeker: run light probes and write marks for review
// Usage: node HiveFleetObsidian/tools/faultline_probes.mjs [--top 10]

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function arg(name, def=''){ const i=process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const topN = Number(arg('top','10'));

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const tools = (p)=> path.join(base,'tools',p);

function runNode(script, args=[]) { return spawnSync('node',[script,...args],{ encoding:'utf8' }); }

// Probe 1: Board freshness
const fres = runNode(tools('board_freshness.mjs'));
let boardStale=false; try{ boardStale = fres.status!==0; }catch{}
if(boardStale){
  runNode(tools('mark_write.mjs'), ['--type','blockage','--topic','board','--signal','stale or missing core fields','--decay','180']);
}

// Probe 2: History gaps
const gap = runNode(tools('history_gap_audit.mjs'));
let gapViol=false; try{ gapViol = gap.status!==0; }catch{}
if(gapViol){
  runNode(tools('mark_write.mjs'), ['--type','risk','--topic','memory_gap','--signal','history gap exceeds threshold','--decay','180']);
}

// Probe 3: Cartography orphans & dangling links (parse markdown summary if present)
const webMap = path.join(base,'cartography','web_map.md');
if (fs.existsSync(webMap)){
  const md = fs.readFileSync(webMap,'utf8');
  const orphanBlock = md.match(/## Orphans\s*\(first 20\)[\s\S]*?\n\n/);
  const danglingBlock = md.match(/## Dangling Links\s*\(first 20\)[\s\S]*?\n\n/);
  const orphanCount = (md.match(/## Orphans/)? (md.split(/## Orphans/)[1].match(/^- /gm)||[]).length : 0);
  const danglingCount = (md.match(/## Dangling Links/)? (md.split(/## Dangling Links/)[1].match(/^- /gm)||[]).length : 0);
  // Write aggregate marks
  runNode(tools('mark_write.mjs'), ['--type','risk','--topic','docs_orphans','--signal',`top-list size ~= ${orphanCount}`,'--decay','720']);
  runNode(tools('mark_write.mjs'), ['--type','risk','--topic','docs_dangling','--signal',`top-list size ~= ${danglingCount}`,'--decay','720']);
}

// Probe 4: Archive candidates (from latest hive_health snapshot)
const analysisDir = path.join(base,'analysis');
function latestInv(){ if(!fs.existsSync(analysisDir)) return null; const files = fs.readdirSync(analysisDir).filter(f=>/^tool_inventory_.*\.json$/.test(f)).map(f=>path.join(analysisDir,f)); if(!files.length) return null; files.sort((a,b)=> fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs); try { return JSON.parse(fs.readFileSync(files[0],'utf8')); } catch { return null; } }
const inv = latestInv();
if (inv && inv.archive_candidates){
  const list = inv.archive_candidates.slice(0, topN).map(a=>a.file).join(', ');
  runNode(tools('mark_write.mjs'), ['--type','risk','--topic','archive_review','--signal',`review first ${Math.min(topN, inv.archive_candidates.length)}: ${list}`,'--decay','1440']);
}

console.log(JSON.stringify({ ok:true }, null, 2));
