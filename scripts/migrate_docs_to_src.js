#!/usr/bin/env node

const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatTS() {
  const now = new Date();
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
}

function runGit(args, opts = {}) {
  console.log('git', args.join(' '));
  const res = spawnSync('git', args, { stdio: 'inherit', ...opts });
  if (res.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed with status ${res.status}`);
  }
}

function runCmd(cmd, opts = {}) {
  console.log('run:', cmd);
  const res = spawnSync(cmd, { shell: true, stdio: 'inherit', ...opts });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd}`);
  }
}

async function walk(dir) {
  const results = [];
  async function _walk(current) {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (err) {
      return;
    }
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) {
        await _walk(full);
      } else if (ent.isFile()) {
        results.push(full);
      }
    }
  }
  await _walk(dir);
  return results;
}

(async function main() {
  try {
    const repoRoot = process.cwd();
    const project = path.join(repoRoot, 'September2025', 'Tectangle');
    const docsDir = path.join(project, 'docs');
    const docsSrc = path.join(docsDir, 'src');
    const docsTests = path.join(docsDir, 'tests');
    const targetSrc = path.join(project, 'src');
    const targetTests = path.join(project, 'tests');

    const ts = formatTS();
    const branchName = `chore/move-docs-src-tests-${ts}`;

    console.log('Repository root:', repoRoot);
    console.log('Project path:', project);
    console.log('Creating branch:', branchName);
    runGit(['checkout', '-b', branchName]);

    console.log('Ensuring target directories exist...');
    await fs.mkdir(targetSrc, { recursive: true });
    await fs.mkdir(targetTests, { recursive: true });

    const docsSrcExists = fsSync.existsSync(docsSrc);
    const docsTestsExists = fsSync.existsSync(docsTests);

    console.log('docs/src exists?', docsSrcExists);
    console.log('docs/tests exists?', docsTestsExists);

    const docsSrcFiles = docsSrcExists ? await walk(docsSrc) : [];
    const docsTestsFiles = docsTestsExists ? await walk(docsTests) : [];

    console.log(`Found ${docsSrcFiles.length} files in docs/src`);
    console.log(`Found ${docsTestsFiles.length} files in docs/tests`);

    const moved = [];
    const duplicates = [];
    const collisions = [];

    async function moveWithConflict(source, baseSrcDir, targetBase) {
      const rel = path.relative(baseSrcDir, source);
      const target = path.join(targetBase, rel);
      await fs.mkdir(path.dirname(target), { recursive: true });

      if (!fsSync.existsSync(target)) {
        runGit(['mv', source, target]);
        moved.push({ source, target });
      } else {
        const a = await fs.readFile(source);
        const b = await fs.readFile(target);
        if (Buffer.compare(a, b) === 0) {
          runGit(['rm', source]);
          duplicates.push({ source, target });
        } else {
          const newTarget = `${target}.from_docs.${ts}`;
          runGit(['mv', source, newTarget]);
          collisions.push({ source, newTarget });
        }
      }
    }

    for (const s of docsSrcFiles) {
      await moveWithConflict(s, docsSrc, targetSrc);
    }
    for (const s of docsTestsFiles) {
      await moveWithConflict(s, docsTests, targetTests);
    }

    // repo-wide textual replacements
    console.log('Searching for repo references to replace (docs/tests/ and docs/src/)');
    const grep1 = spawnSync('git', ['grep', '-l', 'docs/tests/'], { encoding: 'utf8' });
    const files1 = grep1.status === 0 ? grep1.stdout.trim().split('\n').filter(Boolean) : [];
    const grep2 = spawnSync('git', ['grep', '-l', 'docs/src/'], { encoding: 'utf8' });
    const files2 = grep2.status === 0 ? grep2.stdout.trim().split('\n').filter(Boolean) : [];

    const toReplace = Array.from(new Set([...files1, ...files2]));
    console.log('Files to check for replacements:', toReplace.length);

    for (const f of toReplace) {
      try {
        const raw = await fs.readFile(f, 'utf8');
        const replaced = raw.replace(/docs\/tests\//g, 'tests/').replace(/docs\/src\//g, 'src/');
        if (replaced !== raw) {
          await fs.writeFile(f, replaced, 'utf8');
          runGit(['add', f]);
        }
      } catch (err) {
        console.warn('Failed to update file:', f, err.message);
      }
    }

    // commit changes
    runGit(['add', '-A']);
    runGit(['commit', '-m', `chore(migrate): move docs/src & docs/tests -> src & tests (${ts})`]);

    // run unit tests for Tectangle
    console.log('Running unit tests in migrated location...');
    runCmd(`cd "${project}" && npx mocha "tests/unit/**/*.mjs" --exit --reporter spec`);

    // print summary
    const summary = {
      movedCount: moved.length,
      duplicatesCount: duplicates.length,
      collisionsCount: collisions.length,
      moved,
      duplicates,
      collisions,
      filesReplaced: toReplace,
      branch: branchName
    };
    console.log('MIGRATION SUMMARY:');
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();