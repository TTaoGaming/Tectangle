#!/usr/bin/env node
/**
 * Tiny adapter: map neutral orchestration manifest to a CrewAI-like plan.
 * No external deps; prints a runnable outline.
 */

import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const MANI = path.join(ROOT, 'HiveFleetObsidian', 'ship', 'orchestration_manifest.json');

function toCrew(manifest){
  return {
    crew: manifest.agents.map(a => ({ id: a.id, description: a.description, tools: a.toolsAllowed })),
    tasks: manifest.modes.flatMap(m => m.nodes
      .filter(n => n.kind === 'agent' || n.kind === 'tool')
      .map(n => ({ id: `${m.id}:${n.id}`, kind: n.kind, config: n.config }))
    )
  };
}

async function main(){
  const raw = await fs.readFile(MANI, 'utf8');
  const manifest = JSON.parse(raw);
  const out = toCrew(manifest);
  console.log(JSON.stringify(out, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
