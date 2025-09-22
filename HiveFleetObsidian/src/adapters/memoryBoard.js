// In-memory/file-backed Board adapter for Hive Fleet Obsidian
import fs from 'node:fs';
import path from 'node:path';

const nestRoot = path.join('HiveFleetObsidian');
const boardFile = path.join(nestRoot, 'BOARD.current.txt');
const historyFile = path.join(nestRoot, 'history', 'hive_history.jsonl');

export function parseBoardText(txt){
  const lines = (txt||'').split(/\r?\n/).filter(Boolean);
  const map = { Problem:'', Metric:'', Constraint:'', Horizons:'', Current:'' };
  for(const ln of lines){
    const m = ln.match(/^([A-Za-z]+):\s*(.*)$/);
    if(!m) continue;
    const k = m[1]; const v = m[2];
    if(k in map) map[k] = v;
  }
  return {
    problem: map.Problem,
    metric: map.Metric,
    constraint: map.Constraint,
    horizons: map.Horizons,
    current: map.Current,
  };
}

export async function readSnapshot(){
  const txt = fs.existsSync(boardFile) ? fs.readFileSync(boardFile,'utf8') : '';
  return parseBoardText(txt);
}

export async function writeSnapshot(snap){
  const out = [
    `Problem: ${snap.problem||''}`,
    `Metric: ${snap.metric||''}`,
    `Constraint: ${snap.constraint||''}`,
    `Horizons: ${snap.horizons||''}`,
    `Current: ${snap.current||''}`,
  ].join('\n');
  fs.writeFileSync(boardFile, out, 'utf8');
}

export async function appendHistory(hist){
  const line = JSON.stringify({ snapshot:hist.snapshot||'', metric_delta:hist.metric_delta||'n/a', lesson:hist.lesson||'' });
  fs.mkdirSync(path.dirname(historyFile), { recursive:true });
  fs.appendFileSync(historyFile, line + '\n', 'utf8');
}

export async function lastHistoryLine(){
  if(!fs.existsSync(historyFile)) return null;
  const lines = fs.readFileSync(historyFile,'utf8').trim().split(/\r?\n/).filter(Boolean);
  return lines.length ? lines[lines.length-1] : null;
}

export const MemoryBoard = { readSnapshot, writeSnapshot, appendHistory, lastHistoryLine };

