#!/usr/bin/env node
/**
 * Orchestration seed → neutral manifest for graphs/agents/tools
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

function pinchMode(){
  return {
    id: 'pinch_mvp',
    description: 'Deterministic palm/orientation-gated pinch pipeline',
    entry: 'n_source',
    nodes: [
      { id: 'n_source', kind: 'source', config: { topic: 'camera.frames' } },
      { id: 'n_filter', kind: 'transform', config: { smoothing: 'OneEuro', hysteresis: true } },
      { id: 'n_predict', kind: 'transform', config: { lookahead: 'kalman', tti: true, quantize: 'musical' } },
      { id: 'n_pinch', kind: 'transform', config: { fsm: 'pinch', telemetry: true } },
      { id: 'n_sink', kind: 'sink', config: { topic: 'events.pinch' } }
    ],
    edges: [
      { from: 'n_source', to: 'n_filter' },
      { from: 'n_filter', to: 'n_predict' },
      { from: 'n_predict', to: 'n_pinch' },
      { from: 'n_pinch', to: 'n_sink' }
    ]
  };
}

async function main(){
  const manifest = {
    modes: [ pinchMode() ],
    agents: [
      { id: 'scribe', description: 'Scribe/advisor', model: 'neutral', toolsAllowed: ['catalog','verify'] }
    ],
    tools: [
      { id: 'catalog', kind: 'node', entry: 'HiveFleetObsidian/tools/hfo_ship_index.mjs' },
      { id: 'verify', kind: 'process', entry: 'npm', args: ['run','hive:freeze:verify'], timeoutMs: 600000 }
    ],
    io: { topics: ['camera.frames','events.pinch'] },
    env: { requires: ['LLM_API_KEY','TELEMETRY_ENDPOINT'] }
  };

  await write(path.join(MANI, 'orchestration.json'), manifest);
  console.log('Wrote manifests/orchestration.json');
}

main().catch(err => { console.error(err); process.exit(1); });
