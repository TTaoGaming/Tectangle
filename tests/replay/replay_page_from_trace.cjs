// Page-level replay of landmarks JSONL (no MediaPipe/video)
// Usage: DEMO_URL=http://localhost:8080/September2025/TectangleHexagonal/dev/index.html \
//        node tests/replay/replay_page_from_trace.cjs tests/landmarks/right_hand_normal.jsonl
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function readJsonl(p){
  const lines = fs.readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean);
  const frames=[]; let meta=null;
  for(const ln of lines){ const obj = JSON.parse(ln); if(obj.meta){ meta=obj.meta; continue; } frames.push(obj); }
  return { meta, frames };
}

async function main(){
  const file = process.argv[2];
  if(!file){ console.error('Provide a landmarks JSONL file.'); process.exit(2); }
  const { frames } = readJsonl(file);
  const url = process.env.DEMO_URL || 'http://localhost:8080/September2025/TectangleHexagonal/dev/index.html';
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate((frames)=> window.__hex && window.__hex.replayLandmarks ? window.__hex.replayLandmarks(frames) : Promise.reject('replayLandmarks missing'), frames);
  // give a short drain time
  await page.waitForTimeout(200);
  const golden = await page.evaluate(()=> window.__getGolden ? window.__getGolden() : []);
  const outDir = path.resolve('tests/out'); fs.mkdirSync(outDir, { recursive: true });
  const base = path.basename(file).replace(/\.[^.]+$/, '');
  const outFile = path.join(outDir, 'from_trace_' + base + '.jsonl');
  fs.writeFileSync(outFile, golden.join('\n')+'\n');
  console.log('Saved page golden:', outFile, 'lines=', golden.length);
  await browser.close();
}

main().catch(err=>{ console.error(err); process.exit(1); });

