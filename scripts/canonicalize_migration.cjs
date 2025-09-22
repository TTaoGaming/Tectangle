#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function formatSnapshotTimestamp(date) {
  const iso = date.toISOString();
  const noMs = iso.replace(/\.\d+Z$/, 'Z');
  return noMs.replace(/-/g, '').replace(/:/g, '');
}

function ensureDirSync(p) {
  fs.mkdirSync(p, { recursive: true });
}

function extractPathFromMarkdown(s) {
  if (!s || typeof s !== 'string') return s;
  const backtick = s.match(/`([^`]+)`/);
  if (backtick) return backtick[1];
  const paren = s.match(/\(([^)]+)\)/);
  if (paren) return paren[1];
  return s.replace(/^\s*\[*\s*/, '').replace(/\s*\]*\s*$/, '').trim();
}

function isInsideRepo(resolvedPath, repoRoot) {
  const rp = path.resolve(repoRoot);
  const r = path.resolve(resolvedPath);
  return r === rp || r.startsWith(rp + path.sep);
}

function computeMd5AndSize(filePath) {
  const buf = fs.readFileSync(filePath);
  const md5 = crypto.createHash('md5').update(buf).digest('hex');
  return { md5, size: buf.length, rawBuffer: buf };
}

function extractCreatedAtFromContent(content) {
  if (!content) return null;
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return null;
  const body = m[1];
  const c = body.match(/created_at:\s*["']?([^\r\n"']+)["']?/);
  return c ? c[1] : null;
}

function removeYamlFrontMatter(content) {
  if (!content) return '';
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return content;
  return content.slice(m[0].length);
}

function abortWithError(snapshotBase, message, entries) {
  try {
    ensureDirSync(snapshotBase);
    const errPath = path.join(snapshotBase, 'error.txt');
    const payload = `${message}\n\npartial_entries:\n${JSON.stringify(entries, null, 2)}\n`;
    fs.writeFileSync(errPath, payload, 'utf8');
    console.error(message);
    console.error(`Wrote error report: ${errPath}`);
  } catch (e) {
    console.error('Failed to write error report:', e);
  }
  process.exit(2);
}

(function main() {
  const repoRoot = process.cwd();
  const proposalPath = path.join(repoRoot, 'docs', 'knowledge', 'migration_proposal.md');
  if (!fs.existsSync(proposalPath)) {
    console.error('Migration proposal not found at:', proposalPath);
    process.exit(1);
  }
  const md = fs.readFileSync(proposalPath, 'utf8');
  const jsonMatch = md.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) {
    const ts = formatSnapshotTimestamp(new Date());
    const snapshotBase = path.join(repoRoot, 'archive-stale', `migration_snapshot_${ts}`);
    abortWithError(snapshotBase, 'Failed to locate JSON fenced block in migration_proposal.md', []);
  }
  const jsonText = jsonMatch[1];
  let manifest;
  try {
    manifest = JSON.parse(jsonText);
  } catch (e) {
    const ts = formatSnapshotTimestamp(new Date());
    const snapshotBase = path.join(repoRoot, 'archive-stale', `migration_snapshot_${ts}`);
    abortWithError(snapshotBase, 'Failed to parse JSON manifest: ' + e.message, []);
  }
  const ts = formatSnapshotTimestamp(new Date());
  const snapshotBase = path.join(repoRoot, 'archive-stale', `migration_snapshot_${ts}`);
  const originalsDir = path.join(snapshotBase, 'originals');
  const overwritesDir = path.join(snapshotBase, 'overwrites');
  ensureDirSync(originalsDir);
  ensureDirSync(overwritesDir);

  const entries = [];
  let processed = 0, successes = 0, failures = 0, movedCount = 0;

  const candidates = (manifest && manifest.candidates) || [];
  for (const candidate of candidates) {
    processed++;
    const rawOriginal = candidate.original_path;
    const rawCanonical = candidate.recommended_canonical_path;
    const originalRel = (extractPathFromMarkdown(rawOriginal) || '').replace(/\\/g, '/');
    const canonicalRel = (extractPathFromMarkdown(rawCanonical) || '').replace(/\\/g, '/');

    const entry = {
      original_path: originalRel,
      canonical_path: canonicalRel,
      flags: candidate.flags || [],
      reason_for_choice: candidate.reason_for_choice || ''
    };

    entries.push(entry);

    const originalFull = path.resolve(repoRoot, originalRel);
    if (!isInsideRepo(originalFull, repoRoot)) {
      entry.status = 'error: original path outside repo root';
      failures++;
      continue;
    }
    if (!fs.existsSync(originalFull)) {
      entry.status = 'error: original file missing';
      failures++;
      continue;
    }

    let originalBuf;
    try {
      originalBuf = fs.readFileSync(originalFull);
    } catch (e) {
      entry.status = 'error: failed to read original: ' + e.message;
      failures++;
      continue;
    }
    const originalMd5 = crypto.createHash('md5').update(originalBuf).digest('hex');
    const originalSize = originalBuf.length;
    entry.original_md5 = originalMd5;
    entry.original_size = originalSize;

    const backupFull = path.resolve(originalsDir, originalRel);
    ensureDirSync(path.dirname(backupFull));
    try {
      fs.copyFileSync(originalFull, backupFull);
    } catch (e) {
      entry.status = 'error: failed to copy original to backup: ' + e.message;
      failures++;
      continue;
    }

    let backupStat;
    try {
      backupStat = computeMd5AndSize(backupFull);
    } catch (e) {
      entry.status = 'error: failed to compute backup md5/size: ' + e.message;
      failures++;
      continue;
    }
    entry.backup_path = path.relative(repoRoot, backupFull).replace(/\\/g, '/');
    entry.backup_md5 = backupStat.md5;
    entry.backup_size = backupStat.size;

    let candidateCreatedAt = null;
    try {
      if (candidate.proposed_yaml_header && typeof candidate.proposed_yaml_header === 'string') {
        const m = candidate.proposed_yaml_header.match(/created_at:\s*["']?([^\r\n"']+)["']?/);
        if (m) candidateCreatedAt = m[1];
      }
    } catch (e) {}

    const headerTimestampFromOriginal = extractCreatedAtFromContent(originalBuf.toString('utf8'));

    if (!canonicalRel.startsWith('docs/knowledge/')) {
      const message = `Critical safety check failed: canonical path not under docs/knowledge/: ${canonicalRel}`;
      abortWithError(snapshotBase, message, entries);
    }

    const canonicalFull = path.resolve(repoRoot, canonicalRel);
    if (fs.existsSync(canonicalFull)) {
      const overwriteBackupFull = path.resolve(overwritesDir, canonicalRel);
      ensureDirSync(path.dirname(overwriteBackupFull));
      try {
        fs.copyFileSync(canonicalFull, overwriteBackupFull);
        entry.overwrite_backup_path = path.relative(repoRoot, overwriteBackupFull).replace(/\\/g, '/');
        entry.overwrite_occurred = true;
      } catch (e) {
        entry.overwrite_occurred = true;
        entry.overwrite_backup_error = 'failed to copy existing canonical to overwrites: ' + e.message;
      }
    } else {
      entry.overwrite_occurred = false;
    }

    try {
      ensureDirSync(path.dirname(canonicalFull));
      try {
        fs.renameSync(originalFull, canonicalFull);
      } catch (renameErr) {
        fs.copyFileSync(originalFull, canonicalFull);
        fs.unlinkSync(originalFull);
      }
      movedCount++;
      entry.action = 'moved';
    } catch (e) {
      entry.status = 'error: failed to move original to canonical: ' + e.message;
      failures++;
      continue;
    }

    try {
      let canonicalContent = fs.readFileSync(canonicalFull, 'utf8');
      const remainder = removeYamlFrontMatter(canonicalContent);

      let title = null;
      if (candidate.proposed_yaml_header && typeof candidate.proposed_yaml_header === 'string') {
        const tm = candidate.proposed_yaml_header.match(/title:\s*["']?([^\r\n"']+)["']?/);
        if (tm) title = tm[1];
      }
      if (!title) {
        title = path.basename(canonicalRel, path.extname(canonicalRel));
      }

      let created_at = candidateCreatedAt || headerTimestampFromOriginal || (new Date().toISOString().slice(0,10));

      const source = originalRel;

      const newHeaderLines = [
        '---',
        `title: "${title}"`,
        `created_at: "${created_at}"`,
        `source: "${source}"`,
        `author: "auto-generated"`,
        `human_verified: false`,
        '---',
        ''
      ];

      const newContent = newHeaderLines.join('\n') + remainder;
      fs.writeFileSync(canonicalFull, newContent, 'utf8');

      const canonicalStat = computeMd5AndSize(canonicalFull);
      entry.canonical_md5 = canonicalStat.md5;
      entry.canonical_size = canonicalStat.size;
      entry.processed_at = new Date().toISOString();
      entry.status = 'ok';
      successes++;
    } catch (e) {
      entry.status = 'error: header normalization failed: ' + e.message;
      failures++;
      continue;
    }

  } // end for

  const finalManifest = {
    generatedAt: new Date().toISOString(),
    repo: repoRoot,
    totalCandidates: candidates.length,
    processed,
    successes,
    failures,
    entries
  };

  try {
    fs.writeFileSync(path.join(snapshotBase, 'manifest.json'), JSON.stringify(finalManifest, null, 2), 'utf8');
  } catch (e) {
    abortWithError(snapshotBase, 'Failed to write snapshot manifest: ' + e.message, entries);
  }

  const reportRel = path.posix.join('docs', 'knowledge', `canonicalization_report_${ts}.md`);
  const reportFull = path.resolve(repoRoot, reportRel);
  ensureDirSync(path.dirname(reportFull));
  const lines = [];
  lines.push('# Canonicalization Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total candidates: ${candidates.length}`);
  lines.push(`- Processed: ${processed}`);
  lines.push(`- Successes: ${successes}`);
  lines.push(`- Failures: ${failures}`);
  lines.push('');
  lines.push('## Moves');
  lines.push('');
  lines.push('| Original | Canonical | Status | Notes |');
  lines.push('|---|---|---|---|');
  for (const e of entries) {
    const notes = [];
    if (e.overwrite_occurred) notes.push(`overwrote existing canonical (backup: ${e.overwrite_backup_path || ''})`);
    if (e.backup_path) notes.push(`backup: ${e.backup_path}`);
    if (e.canonical_md5) notes.push(`md5: ${e.canonical_md5}`);
    lines.push(`| ${e.original_path || ''} | ${e.canonical_path || ''} | ${e.status || ''} | ${notes.join('; ')} |`);
  }
  lines.push('');
  lines.push(`Snapshot manifest: ${path.relative(repoRoot, path.join(snapshotBase, 'manifest.json')).replace(/\\\\/g, '/')}`);
  lines.push('');

  fs.writeFileSync(reportFull, lines.join('\n'), 'utf8');

  console.log(`Processed ${processed} candidates, moved ${movedCount}, failures ${failures}`);
  console.log(`Snapshot manifest: ${path.relative(repoRoot, path.join(snapshotBase, 'manifest.json')).replace(/\\\\/g, '/')}`);
  console.log(`Report: ${path.relative(repoRoot, reportFull).replace(/\\\\/g, '/')}`);

})();