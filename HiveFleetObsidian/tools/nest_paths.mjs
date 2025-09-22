import fs from 'node:fs';
import path from 'node:path';

export const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
export const toolsPath = (...parts) => path.join(base, 'tools', ...parts);
export const joinBase = (...parts) => path.join(base, ...parts);

export function ensureDir(p){ fs.mkdirSync(p, { recursive:true }); }

