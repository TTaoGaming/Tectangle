#!/usr/bin/env node
/**
 * Seed training orchestration manifest per Training Port
 */

import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const HFO = path.join(ROOT, 'HiveFleetObsidian');
const MANI = path.join(HFO, 'manifests');

async function write(file, obj){
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(obj, null, 2), 'utf8');
}

async function main(){
  const manifest = {
    scenarios: [
      { id: 'pinch_accuracy', modality: 'projector', tools: ['virtual_pinch'], metrics: ['accuracy','latency'] },
      { id: 'party_pinch_race', modality: 'projector', tools: ['virtual_pinch'], metrics: ['success_rate','latency'] }
    ],
    tools: [
      { id: 'virtual_pinch', kind: 'emulation', config: { tui: true, haptics: 'basic' } }
    ]
  };
  await write(path.join(MANI, 'training.json'), manifest);
  console.log('Wrote manifests/training.json');
}

main().catch(err => { console.error(err); process.exit(1); });
