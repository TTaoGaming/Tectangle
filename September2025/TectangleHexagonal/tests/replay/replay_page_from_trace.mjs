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

import puppeteer from 'puppeteer';
import fs from 'fs';

if(process.argv.length < 4){
  console.error('Usage: node tests/replay/replay_page_from_trace.mjs <devPageUrlOrPath> <landmarks.jsonl>');
  process.exit(2);
}

const pageArg = process.argv[2];
const tracePath = process.argv[3];

const devUrl = pageArg.startsWith('http') ? pageArg : `http://localhost:8080/${pageArg.replace(/^\/+/, '')}`;

async function readJsonl(path){
  const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean);
  const arr = [];
  for(const ln of lines){ try{ arr.push(JSON.parse(ln)); }catch{} }
  if(arr.length && arr[0].meta) arr.shift();
  return arr;
}

(async ()=>{
  const browser = await puppeteer.launch({ headless: 'new' });
  try{
    const page = await browser.newPage();
    await page.goto(devUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('window.__hexReady===true', { timeout: 10000 });

    const frames = await readJsonl(tracePath);
    await page.evaluate((frames)=> window.__hex.replayLandmarks(frames), frames);

    const telemetry = await page.evaluate(()=> window.__getTelemetry && window.__getTelemetry());
    console.log(JSON.stringify({ telemetry }));
  } finally {
    await browser.close();
  }
})();
