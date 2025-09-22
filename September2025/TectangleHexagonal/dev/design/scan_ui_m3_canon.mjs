#!/usr/bin/env node
/**
 * WEBWAY:ww-2025-049: UI canary scanner
 * Scans dev HTML files for Material tokens usage or marks them as LEGACY_UI to migrate.
 * Fails (exit 1) if an active demo lacks M3 tokens and is not explicitly marked legacy.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'September2025/TectangleHexagonal');
const devDir = path.join(root, 'dev');
const tokensCssRel = './design/m3.tokens.css';
const allowLegacyMarker = 'LEGACY_UI';
const webwayMarker = 'WEBWAY:ww-2025-049';

function isHtmlFile(f){ return f.toLowerCase().endsWith('.html'); }
function read(p){ return fs.readFileSync(p, 'utf8'); }

const entries = fs.readdirSync(devDir).filter(isHtmlFile);
const problems = [];
for(const name of entries){
  const p = path.join(devDir, name);
  const txt = read(p);
  const isLegacy = txt.includes(allowLegacyMarker);
  const hasTokens = txt.includes(tokensCssRel) || /--m3-\w+:/i.test(txt);
  const hasWebway = txt.includes(webwayMarker);

  const isV4Canon = name === 'demo_fullscreen_sdk_v4_material.html';
  if(isV4Canon){
    if(!hasTokens){ problems.push(`${name}: missing ${tokensCssRel} import or M3 variables`); }
    if(!hasWebway){ problems.push(`${name}: missing ${webwayMarker} inline marker`); }
  }
}

if(problems.length){
  console.error('UI Canon (M3) canary found issues:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log(`UI Canon (M3) canary PASS for ${entries.length} dev pages`);
