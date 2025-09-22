#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const MANI = path.join(ROOT, 'HiveFleetObsidian', 'manifests', 'orchestration.json');

function plan(manifest){
  return manifest.modes.map(m => ({
    id: `lg_${m.id}`,
    entry: m.entry,
    nodes: m.nodes.map(n => ({ id: n.id, type: n.kind, cfg: n.config })),
    edges: m.edges
  }));
}

async function main(){
  const raw = await fs.readFile(MANI, 'utf8');
  const manifest = JSON.parse(raw);
  const out = plan(manifest);
  console.log(JSON.stringify(out, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });