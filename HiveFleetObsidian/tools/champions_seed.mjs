#!/usr/bin/env node
/**
 * Seed champions manifest per Champions Port.
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
  const champions = {
    champions: [
      {
        id: 'FIRE_INNOCENT_REORIENT',
        displayName: 'Fire Innocent Reorient',
        origin: 'mythic',
        archetypes: ['Innocent','Warrior'],
        elements: ['Fire'],
        keywords: ['reorient','ignite','clarify'],
        intent: { goals: ['reframe quickly'], constraints: ['stay safe'] },
        notes: 'Seed example; evolves via feedback.'
      }
    ],
    ratings: {},
    evidence: [],
    timeHorizons: {
      immediate: { objective: 'fast feedback', plan: 'heuristics', metrics: ['latency','stability'] },
      short: { objective: 'robustness', plan: 'MPC', metrics: ['accuracy'] },
      mid: { objective: 'coverage', plan: 'HTN', metrics: ['tasks_done'] },
      long: { objective: 'purpose alignment', plan: 'roadmap', metrics: ['purpose_fit'] }
    }
  };
  await write(path.join(MANI, 'champions.json'), champions);
  console.log('Wrote manifests/champions.json');
}

main().catch(err => { console.error(err); process.exit(1); });
