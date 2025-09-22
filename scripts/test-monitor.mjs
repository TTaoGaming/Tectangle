#!/usr/bin/env node
// Lightweight test monitor for Tectangle — runs unit + smoke + selective golden replays,
// writes a JSON report to `tests/reports/test-monitor-<ts>.json`
// Usage: node scripts/test-monitor.mjs

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const PROJECT = "September2025/Tectangle";
const REPORT_DIR = path.join(PROJECT, "tests", "reports");
const TS = new Date().toISOString().replace(/[:.]/g, "-");
const REPORT_FILE = path.join(REPORT_DIR, `test-monitor-${TS}.json`);

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {}
}

function runCommand(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { encoding: "utf8", windowsHide: true, ...opts });
  return {
    status: res.status,
    stdout: res.stdout || "",
    stderr: res.stderr || "",
  };
}

ensureDir(REPORT_DIR);

console.log("Running unit tests (mocha JSON)...");
const unit = runCommand("npx", ["mocha", "tests/unit/**/*.mjs", "--exit", "--reporter", "json"], { cwd: PROJECT });
console.log("Running smoke tests (node --test on smoke files)...");
const smoke = runCommand("npx", ["mocha", "tests/smoke/**/*.mjs", "--exit", "--reporter", "spec"], { cwd: PROJECT });

const report = {
  ts: new Date().toISOString(),
  project: PROJECT,
  unit,
  smoke,
};

fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), "utf8");
console.log("Report written:", REPORT_FILE);
process.exit(unit.status !== 0 || smoke.status !== 0 ? 1 : 0);