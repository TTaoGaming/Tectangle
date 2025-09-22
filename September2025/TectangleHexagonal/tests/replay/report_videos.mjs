#!/usr/bin/env node
/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Run this test with the latest September2025 build
 - [ ] Log decisions in TODO_2025-09-16.md
*/

// Report pinch confirms by feeding MP4s through the demo in frame-by-frame mode.
// Usage: node report_videos.mjs \
//   "/tests/right hand hand oriented ... pinch.mp4" \
//   "/tests/right hand palm oriented ... GATED.mp4"
// Requires: http-server running at http://127.0.0.1:8081

import puppeteer from 'puppeteer';

const BASE = 'http://127.0.0.1:8081/September2025/TectangleHexagonal/dev/toi_demo.html';
function enc(s){ return encodeURIComponent(s).replace(/%2F/g,'/'); }

async function runOne(browser, relPath, opts){
  const url = `${BASE}?video=${enc(relPath)}&process=frame&stepMs=${opts.stepMs||60}`+
    (opts.enter?`&enter=${opts.enter}`:'')+(opts.exit?`&exit=${opts.exit}`:'')+
    (opts.palm!=null?`&palm=${opts.palm}`:'')+(opts.spec!=null?`&spec=${opts.spec}`:'');
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(()=> window.__processingDone === true, { timeout: 60000 });
  const res = await page.evaluate(()=> ({ confirm: window.__summary?.confirm||0 }));
  await page.close();
  return res;
}

async function main(){
  const [pinch, gated] = process.argv.slice(2);
  if(!pinch || !gated){
    console.error('Usage: node report_videos.mjs "/tests/pinch.mp4" "/tests/gated.mp4"');
    process.exit(2);
  }
  const browser = await puppeteer.launch({ headless: 'new' });
  try{
    // Use finer stepping and slightly looser thresholds to catch the enter crossing deterministically
  const pinchRes = await runOne(browser, pinch, { enter: 0.45, exit: 0.7, palm: 0, spec: 0, stepMs: 25 });
  const gatedRes = await runOne(browser, gated, { enter: 0.45, exit: 0.7, palm: 1, spec: 0, stepMs: 25 });
  const summary = { pinch: { confirms: pinchRes.confirm }, gated: { confirms: gatedRes.confirm } };
  console.log(JSON.stringify({ summary }, null, 2));
    // Exit nonzero if expectations fail
    if(!(pinchRes.confirm>0) || !(gatedRes.confirm===0)) process.exit(1);
  } finally { await browser.close(); }
}

main().catch(err=>{ console.error(err); process.exit(1); });
