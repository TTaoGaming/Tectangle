const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'September2025', 'TectangleHexagonal');
const reviewStart = '2025-09-16T19:48-06:00';
const reviewExpiry = '2025-09-23T19:48-06:00';

const textExtensions = new Set(['.html', '.md', '.txt', '.js', '.mjs', '.cjs', '.css']);
const skipDirs = new Set(['videos', 'out', '.git', 'node_modules']);

let updatedCount = 0;

function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      collectFiles(path.join(dir, entry.name));
    } else if (entry.isFile()) {
      processFile(path.join(dir, entry.name));
    }
  }
}

function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!textExtensions.has(ext)) {
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  if (raw.includes('STIGMERGY REVIEW HEADER')) {
    return;
  }
  const newline = raw.includes('\r\n') ? '\r\n' : '\n';
  const checklist = buildChecklist(filePath);
  const header = buildHeader(ext, newline, checklist);
  const newContent = injectHeader(raw, header, ext, newline);
  fs.writeFileSync(filePath, newContent, 'utf8');
  updatedCount += 1;
}

function buildChecklist(filePath) {
  const checklist = new Set();
  checklist.add('- [ ] Re-evaluate this artifact against current Hexagonal goals');
  const normalized = filePath.split(path.sep).join('/');
  if (normalized.includes('/dev/')) {
    checklist.add('- [ ] Launch the associated prototype and capture findings');
  }
  if (normalized.includes('/tests/')) {
    checklist.add('- [ ] Run this test with the latest September2025 build');
  }
  if (normalized.includes('/src/')) {
    checklist.add('- [ ] Verify dependent modules and update factorization notes');
  }
  if (normalized.includes('/docs/')) {
    checklist.add('- [ ] Validate references against knowledge manifests');
  }
  if (normalized.includes('/tools/') || normalized.includes('/scripts/')) {
    checklist.add('- [ ] Exercise the CLI entry point end-to-end');
  }
  if (normalized.includes('/config/')) {
    checklist.add('- [ ] Confirm boundary assumptions and feature flag alignment');
  }
  if (normalized.includes('/README')) {
    checklist.add('- [ ] Ensure onboarding guidance is still accurate');
  }
  checklist.add('- [ ] Log decisions in TODO_2025-09-16.md');
  return Array.from(checklist);
}

function buildHeader(ext, newline, checklist) {
  const lines = [];
  if (ext === '.html' || ext === '.md') {
    lines.push('<!--');
    lines.push('STIGMERGY REVIEW HEADER');
    lines.push('Status: Pending verification');
    lines.push(`Review started: ${reviewStart}`);
    lines.push(`Expires: ${reviewExpiry} (auto-expire after 7 days)`);
    lines.push('');
    lines.push('Checklist:');
    for (const item of checklist) {
      lines.push(item);
    }
    lines.push('-->');
    return lines.join(newline) + newline + newline;
  }
  if (ext === '.css' || ext === '.js' || ext === '.mjs' || ext === '.cjs') {
    lines.push('/*');
    lines.push('STIGMERGY REVIEW HEADER');
    lines.push('Status: Pending verification');
    lines.push(`Review started: ${reviewStart}`);
    lines.push(`Expires: ${reviewExpiry} (auto-expire after 7 days)`);
    lines.push('');
    lines.push('Checklist:');
    for (const item of checklist) {
      lines.push(` ${item}`);
    }
    lines.push('*/');
    return lines.join(newline) + newline + newline;
  }
  lines.push('STIGMERGY REVIEW HEADER');
  lines.push('Status: Pending verification');
  lines.push(`Review started: ${reviewStart}`);
  lines.push(`Expires: ${reviewExpiry} (auto-expire after 7 days)`);
  lines.push('');
  lines.push('Checklist:');
  for (const item of checklist) {
    lines.push(item);
  }
  lines.push('----');
  return lines.join(newline) + newline + newline;
}

function injectHeader(content, header, ext, newline) {
  if (ext === '.html') {
    const firstLineEnd = content.indexOf(newline);
    if (content.toLowerCase().startsWith('<!doctype') && firstLineEnd !== -1) {
      const firstLine = content.slice(0, firstLineEnd + newline.length);
      const rest = content.slice(firstLineEnd + newline.length);
      return firstLine + header + rest;
    }
  }
  if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
    if (content.startsWith('#!')) {
      const firstLineEnd = content.indexOf(newline);
      if (firstLineEnd !== -1) {
        const firstLine = content.slice(0, firstLineEnd + newline.length);
        const rest = content.slice(firstLineEnd + newline.length);
        return firstLine + header + rest;
      }
    }
  }
  return header + content;
}

collectFiles(root);
console.log(`Applied stigmergy headers to ${updatedCount} files.`);