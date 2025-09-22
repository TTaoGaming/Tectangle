#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const scaffoldsDir = path.join(repoRoot, 'scaffolds');
const requiredFrontMatterKeys = ['id', 'owner', 'status', 'expires_on', 'guard', 'flag', 'revert'];
const allowedStatusValues = new Set(['active', 'ready', 'done', 'expired']);
const requiredHeadings = [
  { label: '# Webway:', regex: /^# Webway: .+/m },
  { label: '## Goal', regex: /^## Goal\s*$/m },
  { label: '## Constraints', regex: /^## Constraints\s*$/m },
  { label: '## Current Map', regex: /^## Current Map\s*$/m },
  { label: '## Timebox', regex: /^## Timebox\s*$/m },
  { label: '## Research Notes', regex: /^## Research Notes\s*$/m },
  { label: '## Tool Inventory', regex: /^## Tool Inventory\s*$/m },
  { label: '## Options (Adopt-first)', regex: /^## Options \(Adopt-first\)\s*$/m },
  { label: '## Recommendation', regex: /^## Recommendation\s*$/m },
  { label: '## First Slice', regex: /^## First Slice\s*$/m },
  { label: '## Guard & Flag', regex: /^## Guard & Flag\s*$/m },
  { label: '## Industry Alignment', regex: /^## Industry Alignment\s*$/m },
  { label: '## Revert', regex: /^## Revert\s*$/m },
  { label: '## Follow-up', regex: /^## Follow-up\s*$/m }
];

const guardFlagChecks = [
  { label: 'Guard bullet', regex: /^-\s*Guard: .+/m },
  { label: 'Flag bullet', regex: /^-\s*Flag: .+/m }
];

const industryChecks = [
  { label: 'Standard bullet', regex: /^-\s*Standard: .+/m },
  { label: 'State-of-the-art bullet', regex: /^-\s*State-of-the-art: .+/m }
];

const followUpChecks = [
  { label: 'TTL check bullet', regex: /^-\s*TTL check: .+/m }
];

function emitWarning(filePath, message) {
  console.log(`::warning file=${filePath.replace(/\\/g, '/')}::${message}`);
}

function validateFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const content = raw.replace(/\r\n/g, '\n');
  const issues = [];

  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontMatterMatch) {
    issues.push('Missing or malformed YAML front matter block.');
  } else {
    const frontMatter = frontMatterMatch[1];
    const fmLines = frontMatter
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const fmMap = new Map();
    for (const line of fmLines) {
      const idx = line.indexOf(':');
      if (idx === -1) {
        issues.push(`Front matter line without key/value delimiter: "${line}"`);
        continue;
      }
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (!fmMap.has(key)) {
        fmMap.set(key, value);
      }
    }

    for (const key of requiredFrontMatterKeys) {
      if (!fmMap.has(key)) {
        issues.push(`Missing front matter key: ${key}`);
      } else if (!fmMap.get(key)) {
        issues.push(`Front matter key "${key}" should not be empty.`);
      }
    }

    if (fmMap.has('status')) {
      const status = fmMap.get('status');
      if (!allowedStatusValues.has(status)) {
        issues.push(
          `Front matter status "${status}" must be one of: ${Array.from(allowedStatusValues).join(', ')}`
        );
      }
    }

    if (fmMap.has('id')) {
      const id = fmMap.get('id');
      const expectedSlug = id.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
      const slugFromFile = relativePath
        .split(path.sep)
        .pop()
        .replace(/^webway_/, '')
        .replace(/\.md$/, '')
        .toLowerCase();
      if (!slugFromFile.includes(expectedSlug)) {
        issues.push(`Webway id "${id}" does not align with filename segment "${slugFromFile}".`);
      }
    }
  }

  const body = frontMatterMatch ? content.slice(frontMatterMatch[0].length) : content;

  for (const heading of requiredHeadings) {
    if (!heading.regex.test(body)) {
      issues.push(`Missing required heading: ${heading.label}`);
    }
  }

  for (const check of guardFlagChecks) {
    if (!check.regex.test(body)) {
      issues.push(`Missing ${check.label} under "## Guard & Flag".`);
    }
  }

  for (const check of industryChecks) {
    if (!check.regex.test(body)) {
      issues.push(`Missing ${check.label} under "## Industry Alignment".`);
    }
  }

  for (const check of followUpChecks) {
    if (!check.regex.test(body)) {
      issues.push(`Missing ${check.label} under "## Follow-up".`);
    }
  }

  const researchNotesMatch = body.match(/## Research Notes\s*\n([\s\S]*?)(\n##|$)/);
  if (researchNotesMatch) {
    const notesBlock = researchNotesMatch[1].trim();
    if (notesBlock && !/^-/m.test(notesBlock)) {
      issues.push('Section "## Research Notes" should contain bullet entries.');
    }
  }

  const toolInventoryMatch = body.match(/## Tool Inventory\s*\n([\s\S]*?)(\n##|$)/);
  if (toolInventoryMatch) {
    const toolsBlock = toolInventoryMatch[1].trim();
    if (toolsBlock && !/^-/m.test(toolsBlock)) {
      issues.push('Section "## Tool Inventory" should list tools using bullet points.');
    }
  }

  const optionsMatch = body.match(/## Options \(Adopt-first\)\s*\n([\s\S]*?)(\n##|$)/);
  if (optionsMatch) {
    const optionsBlock = optionsMatch[1];
    const optionCount = (optionsBlock.match(/\n?\s*\d+\.\s+\*\*Adopt /g) || []).length;
    if (optionCount !== 3) {
      issues.push('Section "## Options (Adopt-first)" must contain exactly three numbered options beginning with "Adopt".');
    }
  }

  return issues;
}

function writeSummary(issueMap, totalIssues) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }
  const lines = [];
  lines.push('# Webway format check');
  if (totalIssues === 0) {
    lines.push('\nAll Webway notes matched the required format.');
  } else {
    const maxRows = 25;
    lines.push(`\nDetected **${totalIssues}** format issue(s) across **${issueMap.size}** file(s).`);
    lines.push('\n| File | Issues |');
    lines.push('| --- | ---: |');
    let rowCount = 0;
    for (const [file, issues] of issueMap) {
      if (rowCount >= maxRows) {
        lines.push('| ... | ... |');
        lines.push(`\nShowing first ${maxRows} files. Check logs for the full list.`);
        break;
      }
      lines.push(`| ${file} | ${issues.length} |`);
      rowCount += 1;
    }
    lines.push('\nReview the warning annotations in the build log for full details.');
  }
  fs.writeFileSync(summaryPath, lines.join('\n'));
}

function main() {
  if (!fs.existsSync(scaffoldsDir)) {
    console.log('No scaffolds directory found; skipping Webway format checks.');
    return;
  }

  const entries = fs.readdirSync(scaffoldsDir, { withFileTypes: true });
  const webwayFiles = entries
    .filter((entry) => entry.isFile() && entry.name.startsWith('webway_') && entry.name.endsWith('.md'))
    .map((entry) => path.join('scaffolds', entry.name))
    .sort();

  if (webwayFiles.length === 0) {
    console.log('No Webway scaffolds found to validate.');
    return;
  }

  let totalIssues = 0;
  const issueMap = new Map();

  for (const file of webwayFiles) {
    try {
      const issues = validateFile(file);
      if (issues.length > 0) {
        issueMap.set(file.replace(/\\/g, '/'), issues);
      }
      totalIssues += issues.length;
      for (const issue of issues) {
        emitWarning(file, issue);
      }
    } catch (err) {
      const message = `Failed to validate file: ${err.message}`;
      emitWarning(file, message);
      const key = file.replace(/\\/g, '/');
      const existing = issueMap.get(key) || [];
      existing.push(message);
      issueMap.set(key, existing);
      totalIssues += 1;
    }
  }

  if (totalIssues === 0) {
    console.log('Webway format check completed: no issues found.');
  } else {
    console.log(`Webway format check completed: detected ${totalIssues} issue(s).`);
  }

  writeSummary(issueMap, totalIssues);
}

main();