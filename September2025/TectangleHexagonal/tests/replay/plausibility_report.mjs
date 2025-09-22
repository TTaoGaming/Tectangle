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

// Minimal plausibility report using the demo with frame-by-frame detection.
// Usage: node plausibility_report.mjs \
//   "/videos/right_hand_normal.mp4" \
//   "/videos/right_hand_gated.mp4"
// Requires: http-server at http://127.0.0.1:8081

import puppeteer from 'puppeteer';

const BASE = 'http://127.0.0.1:8081/September2025/TectangleHexagonal/dev/toi_demo.html';
function enc(s){ return encodeURIComponent(s).replace(/%2F/g,'/'); }

async function runOne(browser, relPath, opts){
  const url = `${BASE}?video=${enc(relPath)}&process=frame&stepMs=${opts.stepMs||40}`+
    `&enter=${opts.enter??0.45}&exit=${opts.exit??0.7}&palm=${opts.palm??0}&spec=0`;
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(()=> window.__processingDone === true, { timeout: 60000 });
  const res = await page.evaluate(()=> ({ confirm: window.__summary?.confirm||0, plausible: !!window.__plausible }));
  await page.close();
  return res;
}

async function main(){
  const [pinch, gated] = process.argv.slice(2);
  if(!pinch || !gated){
    console.error('Usage: node plausibility_report.mjs "/videos/pinch.mp4" "/videos/gated.mp4"');
    process.exit(2);
  }
  const browser = await puppeteer.launch({ headless: 'new' });
  try{
    const a = await runOne(browser, pinch, { stepMs: 30 });
    const b = await runOne(browser, gated, { stepMs: 30 });
    const summary = { pinch: a, gated: b };
    console.log(JSON.stringify({ summary }, null, 2));
    // Expect pinch to end with plausible true at least once; gated to end false
    if(!(a.confirm>0 || a.plausible===true) || !(b.confirm===0 || b.plausible===false)) process.exit(1);
  } finally { await browser.close(); }
}

main().catch(err=>{ console.error(err); process.exit(1); });
