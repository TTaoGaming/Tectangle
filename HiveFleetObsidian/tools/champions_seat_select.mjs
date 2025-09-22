#!/usr/bin/env node
/**
 * Seat selection: choose champions for counsel seats using a simple bandit heuristic.
 */

import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const HFO = path.join(ROOT, 'HiveFleetObsidian');
const MANI = path.join(HFO, 'manifests');

async function readJson(p, fallback){
  try{ const raw = await fs.readFile(p, 'utf8'); return JSON.parse(raw); } catch { return fallback; }
}

function score(ch, ratings){
  const r = ratings?.[ch.id];
  if(!r) return 0.5; // prior
  const elo = r.elo ?? 1000;
  const mu = r.trueskill?.mu ?? 25;
  return 0.5 + (elo-1000)/2000 + (mu-25)/50; // rough composite
}

function select(champions, ratings, k=4){
  const scored = champions.map(c => ({ c, s: score(c, ratings) + Math.random()*0.05 }));
  scored.sort((a,b)=>b.s-a.s);
  return scored.slice(0,k).map(x=>x.c);
}

async function main(){
  const state = await readJson(path.join(MANI, 'champions.json'), { champions: [], ratings:{}, evidence:[] });
  const picks = select(state.champions||[], state.ratings||{}, 4);
  const out = { ts: new Date().toISOString(), seats: picks.map(p => p.id) };
  const file = path.join(MANI, 'champions_seats.json');
  await fs.writeFile(file, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote ${file}`);
}

main().catch(err => { console.error(err); process.exit(1); });
