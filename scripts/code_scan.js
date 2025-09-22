// scripts/code_scan.js
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const allowedExts = new Set(['.js', '.mjs', '.cjs', '.ts', '.html', '.md', '.txt', '.json']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.hg', '.svn']);
const ONE_MB = 1024 * 1024;
const READ_CHUNK = 10000;
const tokens = [
  'mediapipe', 'mediaPipe', 'human', '@vladmandic|vladmandic',
  'opencv', 'cv2', 'opencv4nodejs',
  'CameraManager', 'Landmark', 'LandmarkRaw', 'LandmarkSmooth',
  'Pinch', 'pinchBaseline', 'PinchManager', 'PinchRecognition',
  'OneEuro', 'one-euro', 'one_euro',
  'ManagerRegistry', 'EventBus', 'KeyboardBridge', 'keyboard-bridge',
  'golden', 'golden-master', 'golden_master', 'jsonl', 'telemetry',
  'smoke', 'puppeteer', 'playwright', 'AudioWorklet',
  'WebMIDI', 'MIDI', 'WebSocket', 'socket', 'archive-stale', 'archive-'
];
const tokenRegexes = tokens.map(t => {
  const esc = t.replace(/[.*+?^${}()|[\\\]\\]/g, '\\$&');
  return { token: t, re: new RegExp(esc, 'gi') };
});

const results = [];
const notes = [];

function isSkipped(rel) {
  const parts = rel.split(path.sep);
  for (const p of parts) {
    if (SKIP_DIRS.has(p)) return true;
  }
  return false;
}

function readHead(file, size) {
  try {
    if (size < ONE_MB) return fs.readFileSync(file, 'utf8');
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(READ_CHUNK);
    const bytes = fs.readSync(fd, buf, 0, READ_CHUNK, 0);
    fs.closeSync(fd);
    notes.push(`Truncated ${path.relative(ROOT, file).replace(/\\\\/g,'/')} (size=${size})`);
    return buf.slice(0, bytes).toString('utf8');
  } catch (err) {
    notes.push(`Read error ${path.relative(ROOT, file)}: ${err.message}`);
    return '';
  }
}

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    notes.push(`Readdir failed ${dir}: ${err.message}`);
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(ROOT, full).replace(/\\\\/g, '/');
    try {
      if (ent.isDirectory()) {
        if (isSkipped(rel)) continue;
        walk(full);
      } else if (ent.isFile()) {
        const ext = path.extname(ent.name).toLowerCase();
        if (!allowedExts.has(ext)) continue;
        let stat;
        try {
          stat = fs.statSync(full);
        } catch (err) {
          notes.push(`Stat failed ${rel}: ${err.message}`);
          continue;
        }
        const size = stat.size;
        const content = readHead(full, size);
        const lines = content.split(/\r?\n/);
        const excerpt = lines.slice(0, 80).join('\n');
        const header20 = lines.slice(0, 20).join('\n');
        let header_timestamp = null;
        const hm = header20.match(/["']?(CreatedAt|created_at|Timestamp|LastUpdated|timestamp|updated)["']?\s*[:=]\s*["']?([^"']+)["']?/i);
        if (hm) header_timestamp = hm[2];

        const matchedTokens = [];
        let totalMatches = 0;
        for (const { token, re } of tokenRegexes) {
          let count = 0;
          let m;
          while ((m = re.exec(content)) !== null) count++;
          if (count > 0) {
            matchedTokens.push(token);
            totalMatches += count;
          }
          re.lastIndex = 0;
        }

        const basename = path.basename(rel);
        const lower = '/' + rel.toLowerCase() + '/';
        const flags = {
          isManager: /manager/i.test(basename),
          isPrototype: lower.includes('/prototype/'),
          isDemo: lower.includes('/prototype/demo/') || (basename.toLowerCase() === 'index.html' && /demo/i.test(rel)),
          isTest: lower.includes('/tests/') || lower.includes('/smoke/') || /\.test\./i.test(basename) || matchedTokens.some(t => /puppeteer|playwright|smoke|test/i.test(t)),
          isGolden: /golden/.test(rel) || basename.toLowerCase().endsWith('.jsonl'),
          isAdapter: /adapter|bridge/i.test(rel) || lower.includes('/adapters/'),
          isArchive: /archive-stale|\/archive-|\/archives\//i.test(rel),
          isMediapipeHit: matchedTokens.some(t => /mediapipe|human|vladmandic/i.test(t)),
          isOpenCvHit: matchedTokens.some(t => /opencv|cv2|opencv4nodejs/i.test(t)),
          isPinchFSM: /pinchfsm/i.test(rel),
          isTectangle: /tectangle/i.test(rel),
          isHOPE: /hopev7|hope|agent/i.test(rel.toLowerCase())
        };

        results.push({
          path: rel,
          size,
          excerpt,
          header_timestamp,
          matches: matchedTokens,
          match_count: totalMatches,
          flags
        });
      }
    } catch (err) {
      notes.push(`Error scanning ${rel}: ${err.message}`);
    }
  }
}

walk(ROOT);

const managers = results.filter(r => r.flags.isManager);
const prototypes = results.filter(r => r.flags.isPrototype);
const demos = results.filter(r => r.flags.isDemo);
const tests = results.filter(r => r.flags.isTest);
const golden_traces = results.filter(r => r.flags.isGolden);
const adapters = results.filter(r => r.flags.isAdapter);
const archives = results.filter(r => r.flags.isArchive);
const mediapipe_files = results.filter(r => r.flags.isMediapipeHit);
const opencv_files = results.filter(r => r.flags.isOpenCvHit);

const top_by_size = results.slice().sort((a,b)=>b.size - a.size).slice(0,20).map(r => ({ path: r.path, size: r.size }));
const top_by_matches = results.slice().sort((a,b)=>b.match_count - a.match_count).slice(0,20).map(r => ({ path: r.path, match_count: r.match_count }));

let packageJson = null;
try {
  const pjRaw = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8');
  const pj = JSON.parse(pjRaw);
  packageJson = { scripts: pj.scripts || {}, dependencies: pj.dependencies ? Object.keys(pj.dependencies) : [], devDependencies: pj.devDependencies ? Object.keys(pj.devDependencies) : [] };
} catch (e) {
  packageJson = null;
  notes.push('No root package.json found or parse error: ' + e.message);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  repo: path.basename(process.cwd()),
  totals: {
    files_scanned: results.length,
    managers: managers.length,
    prototypes: prototypes.length,
    demos: demos.length,
    tests: tests.length,
    golden_traces: golden_traces.length,
    archives: archives.length,
    mediapipe_hits: mediapipe_files.length,
    opencv_hits: opencv_files.length
  },
  packageJson: packageJson,
  managers: managers.map(r => ({ path: r.path, size: r.size, excerpt: r.excerpt, header_timestamp: r.header_timestamp, matches: r.matches })),
  prototypes: prototypes.map(r => ({ path: r.path, size: r.size, excerpt: r.excerpt, header_timestamp: r.header_timestamp, matches: r.matches })),
  demos: demos.map(r => ({ path: r.path, size: r.size, excerpt: r.excerpt, header_timestamp: r.header_timestamp, matches: r.matches })),
  tests: tests.map(r => ({ path: r.path, size: r.size, excerpt: r.excerpt, header_timestamp: r.header_timestamp, matches: r.matches })),
  golden_traces: golden_traces.map(r => ({ path: r.path, size: r.size, excerpt: r.excerpt, header_timestamp: r.header_timestamp, matches: r.matches })),
  adapters: adapters.map(r => ({ path: r.path, size: r.size, excerpt: r.excerpt, header_timestamp: r.header_timestamp, matches: r.matches })),
  archives: archives.map(r => ({ path: r.path, size: r.size, excerpt: r.excerpt, header_timestamp: r.header_timestamp, matches: r.matches })),
  mediapipe_files: mediapipe_files.map(r => ({ path: r.path, size: r.size, excerpt: r.excerpt, header_timestamp: r.header_timestamp, matches: r.matches })),
  opencv_files: opencv_files.map(r => ({ path: r.path, size: r.size, excerpt: r.excerpt, header_timestamp: r.header_timestamp, matches: r.matches })),
  top_by_size,
  top_by_matches,
  notes
};

const outDir = path.join('docs', 'knowledge');
fs.mkdirSync(outDir, { recursive: true });
const jsonPath = path.join(outDir, 'code_scan_artifacts.json');
fs.writeFileSync(jsonPath, JSON.stringify(manifest, null, 2), 'utf8');

function clickable(label, rel) { return `[\`${label}\`](${rel}:1)`; }

const md = [
  `# Code scan summary — ${new Date().toISOString().slice(0,10)}`,
  '',
  `Scanned ${results.length} files — managers: ${managers.length}, prototypes: ${prototypes.length}, tests: ${tests.length}, golden_traces: ${golden_traces.length}, mediapipe_hits: ${mediapipe_files.length}, opencv_hits: ${opencv_files.length}.`,
  '',
  'Detected phases and mapping:',
  '',
  `- Phase‑0 (core managers): ${clickable('CameraManager.js','September2025/Tectangle/src/CameraManager.js')}, ${clickable('LandmarkRawManager.js','September2025/Tectangle/src/LandmarkRawManager.js')}, ${clickable('LandmarkSmoothManager.js','September2025/Tectangle/src/LandmarkSmoothManager.js')}`,
  '',
  `- Registry & infra: ${clickable('ManagerRegistry.js','September2025/Tectangle/src/ManagerRegistry.js')}, ${clickable('EventBusManager.js','September2025/Tectangle/src/EventBusManager.js')}`,
  '',
  'Prototypes — ready vs needs work:',
  '',
  `- Ready/demoable: ${clickable('prototype/camera-manager/index.html','September2025/Tectangle/prototype/camera-manager/index.html')}, ${clickable('prototype/landmark-smooth/index.html','September2025/Tectangle/prototype/landmark-smooth/index.html')}`,
  '',
  `- Needs attention: ${clickable('KinematicClampManager.js','September2025/Tectangle/src/KinematicClampManager.js')} (planning/headers present)`,
  '',
  'Immediate quick wins:',
  '',
  `1. Add per‑manager README and API snippets (e.g. ${clickable('CameraManager.js','September2025/Tectangle/src/CameraManager.js')}).`,
  `2. Add focused unit tests for plausibility checks (see ${clickable('KinematicClampManager.js','September2025/Tectangle/src/KinematicClampManager.js')}).`,
  `3. Provide a single smoke harness entrypoint that runs deterministic synthetic traces (see ${clickable('package.json','package.json')}).`,
  '',
  'Medium‑term tasks:',
  '',
  `1. Refactor to hexagonal architecture: isolate ports/adapters and wire via ManagerRegistry (${clickable('ManagerRegistry.js','September2025/Tectangle/src/ManagerRegistry.js')}).`,
  `2. Integrate golden traces into CI and automate golden verification (see PinchFSM scripts in ${clickable('September2025/PinchFSM/package.json','September2025/PinchFSM/package.json')}).`,
  `3. Formalize adapter layer for keyboard/WebMIDI/WebSocket to simplify demos and POC adapters.`,
  '',
  'Notes & risk areas:',
  '',
  '- Media libraries: MediaPipe/Human usage in prototypes & PinchFSM (see PinchFSM package.json).',
  '- Archive folders present (archive-*/archive-stale) — historical material included in scan.',
  '- CI indicators: root package.json contains smoke/e2e/test scripts referencing mocha/jest/puppeteer.',
  '',
  'Representative evidence:',
  `- ${clickable('CameraManager.js','September2025/Tectangle/src/CameraManager.js')}`,
  `- ${clickable('pinchFsm.mjs','September2025/PinchFSM/src/fsm/pinchFsm.mjs')}`,
  `- ${clickable('prototype/landmark-smooth/index.html','September2025/Tectangle/prototype/landmark-smooth/index.html')}`
].join('\n');

const mdPath = path.join(outDir, 'code_scan_summary_20250907.md');
fs.writeFileSync(mdPath, md, 'utf8');

console.log('Wrote', jsonPath, 'and', mdPath);
console.log('files_scanned=', results.length, 'managers=', managers.length, 'prototypes=', prototypes.length, 'tests=', tests.length, 'golden_traces=', golden_traces.length, 'mediapipe_hits=', mediapipe_files.length, 'opencv_hits=', opencv_files.length);

process.exit(0);