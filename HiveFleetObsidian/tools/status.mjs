// Print current Board and last Scribe history line
import fs from 'node:fs';
import path from 'node:path';

// Support both lowercase and CamelCase nest directories; prefer one that exists
const candidates = ['hive_fleet_obsidian', 'HiveFleetObsidian'];
const baseDir = candidates.find(d => fs.existsSync(d)) || candidates[0];
const boardPath = path.join(baseDir, 'BOARD.current.txt');
const historyPath = path.join(baseDir, 'history', 'hive_history.jsonl');

function printSection(title){
  console.log(`\n=== ${title} ===`);
}

if (fs.existsSync(boardPath)) {
  printSection('BOARD.current');
  console.log(fs.readFileSync(boardPath, 'utf8').trim());
} else {
  console.log('No BOARD.current.txt found.');
}

if (fs.existsSync(historyPath)) {
  const lines = fs.readFileSync(historyPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const last = lines[lines.length - 1];
  printSection('history (last)');
  console.log(last || '(empty)');
} else {
  printSection('history');
  console.log('(no history file)');
}
