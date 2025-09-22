#!/usr/bin/env node
/**
 * HFO Ship: Manifest generator
 * - Captures a minimal manifest for portability
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
    name: 'HFO Ship',
    createdAt: new Date().toISOString(),
    policy: 'NOT-PRODUCTION-READY unless verified',
    indices: {
      world: 'HiveFleetObsidian/navigation/WORLD_LOCAL_INDEX.md',
      gold: 'HiveFleetObsidian/navigation/GOLD_LOCAL_INDEX.md'
    },
    verificationPort: 'HiveFleetObsidian/contracts/VERIFICATION_PORT.md'
  };

  await write(path.join(MANI, 'manifest.json'), manifest);
  console.log('HFO Ship manifest written');
}

main().catch(err => { console.error(err); process.exit(1); });
