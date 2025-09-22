#!/usr/bin/env node
// Unified commit guard: prevents unintended edits to sensitive categories (chatmodes now; extendable) unless
// commit message explicitly allows. Also enforces a summary acknowledgment when context-summarizing actions
// would touch guarded paths (requires [summary-ok] token if a summary marker is present and guarded files are changed).
// Allow mechanisms (any one):
//  - Env ALLOW_CHATMODE_EDITS=1 (category-specific)
//  - Env ALLOW_GUARDED=1 (global override)
//  - Commit message token: [allow-chatmodes] for chatmodes
//  - Commit message token: [allow-guarded] for any guarded category
// Additional safety: If commit message contains pattern 'summary' (case-insensitive) or 'context summary'
// AND guarded files are changed, require token [summary-ok].
import { execSync } from 'node:child_process';
import fs from 'node:fs';

function getStagedFiles() {
  const out = execSync('git diff --cached --name-only', { encoding: 'utf8' });
  return out.split(/\r?\n/).filter(Boolean);
}

function getCommitMsg() {
  // Husky passes COMMIT_EDITMSG path as argv[2] to commit-msg hooks
  const argPath = process.argv && process.argv[2] ? String(process.argv[2]) : null;
  const envPath = process.env.HUSKY_GIT_PARAMS || process.env.GIT_PARAMS || '.git/COMMIT_EDITMSG';
  const path = argPath || envPath;
  try { return fs.readFileSync(path, 'utf8'); } catch {}
  try { return execSync('git log -1 --pretty=%B', { encoding: 'utf8' }); } catch { return ''; }
}

function classify(staged){
  const chatmode = staged.filter(p => p.toLowerCase().startsWith('.github/chatmodes/') && /\.chatmode\.md$/i.test(p));
  return { chatmode };
}

function needsSummaryAck(msg){
  return /summary|context\s*summary/i.test(msg);
}

function main(){
  const staged = getStagedFiles();
  if(!staged.length) return;
  const msg = getCommitMsg();
  const categories = classify(staged);
  const guardedTouched = [];
  if(categories.chatmode.length) guardedTouched.push({ name:'chatmodes', files: categories.chatmode, allowEnv: 'ALLOW_CHATMODE_EDITS', allowToken: '[allow-chatmodes]' });

  if(!guardedTouched.length) return; // nothing guarded

  const globalOverride = process.env.ALLOW_GUARDED === '1' || /\[allow-guarded\]/i.test(msg);
  const summaryAckRequired = needsSummaryAck(msg) && guardedTouched.length > 0;
  const hasSummaryAck = /\[summary-ok\]/i.test(msg);

  for(const cat of guardedTouched){
    const envAllowed = process.env[cat.allowEnv] === '1';
    const tokenAllowed = new RegExp(cat.allowToken.replace(/[.*+?^${}()|[\]\\]/g,'\\$'),'i').test(msg);
    if(globalOverride || envAllowed || tokenAllowed) continue; // allowed by some mechanism
    console.error(`Commit blocked: guarded category '${cat.name}' modified without explicit allow.`);
    console.error('Files:');
    cat.files.forEach(f=> console.error(' - ' + f));
    console.error('\nTo proceed, add one of:');
    console.error(` - set ${cat.allowEnv}=1`);
    console.error(` - set ALLOW_GUARDED=1`);
    console.error(` - include ${cat.allowToken} in commit message`);
    console.error(' - include [allow-guarded] in commit message');
    process.exit(1);
  }

  if(summaryAckRequired && !hasSummaryAck && !globalOverride){
    console.error('Commit blocked: summary/context summary detected touching guarded files without [summary-ok] token.');
    console.error('Add [summary-ok] to commit message after manual review.');
    process.exit(1);
  }
}

main();
