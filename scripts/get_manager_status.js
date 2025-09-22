#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const registry = require('../lib/manager-registry');

/**
 * scripts/get_manager_status.js
 *
 * Tries to register a small set of known managers (if their files exist),
 * then prints a JSON object with manager statuses that Hope can consume.
 *
 * Usage:
 *   node scripts/get_manager_status.js
 *
 * Output:
 *   {
 *     "Timestamp": "...",
 *     "Managers": {
 *       "CameraManager": { "running": true, "lastError": null, "metrics": {...} },
 *       ...
 *     }
 *   }
 */

// Candidate manager modules (relative to repo root)
const candidatePaths = [
  'August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/CameraManager.js',
  'August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/EventBusManager.js',
  'August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/LandmarkSmoothManager.js',
  'August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/TelemetryManager.js'
];

function tryRegister(relPath) {
  const fullPath = path.resolve(__dirname, '..', ...relPath.split('/'));
  if (!fs.existsSync(fullPath)) {
    return false;
  }
  try {
    const mod = require(fullPath);
    const name = path.basename(relPath, '.js');
    registry.registerManager(name, mod);
    return true;
  } catch (err) {
    // Non-fatal: log and continue
    console.error(`Warning: failed to require ${fullPath}: ${err.message}`);
    return false;
  }
}

for (const p of candidatePaths) {
  tryRegister(p);
}

(async function main() {
  try {
    const statuses = await registry.getStatuses();
    console.log(JSON.stringify({
      Timestamp: new Date().toISOString(),
      Managers: statuses
    }, null, 2));
  } catch (err) {
    console.error('Failed to get statuses:', err && err.stack ? err.stack : String(err));
    process.exitCode = 1;
  }
})();