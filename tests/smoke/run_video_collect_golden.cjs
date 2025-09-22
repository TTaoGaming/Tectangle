// Usage: node tests/smoke/run_video_collect_golden.cjs <relative-path-to-mp4>
// Requires: npm i -D http-server puppeteer (serve root at http://localhost:8080)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function main(){
  const videoPath = process.argv[2];
  if(!videoPath){
    console.error('Provide a video path. Example: node tests/smoke/run_video_collect_golden.cjs ".../video.mp4"');
    process.exit(1);
  }
  const absVideo = path.resolve(videoPath);
  if(!fs.existsSync(absVideo)){
    console.error('Video not found:', absVideo);
    process.exit(1);
  }
  const url = process.env.DEMO_URL || 'http://localhost:8080/September2025/TectangleHexagonal/dev/index.html';
  const browser = await puppeteer.launch({ headless: 'new', args:[ '--autoplay-policy=no-user-gesture-required' ] });
  const page = await browser.newPage();
  page.on('console', msg => {
    try { console.log('[page]', msg.type(), msg.text()); } catch {}
  });
  page.on('pageerror', err => { console.error('[pageerror]', err?.message||err); });
  await page.goto(url, { waitUntil: 'networkidle2' });

  await page.evaluate(({enter, exit})=>{
    const set=(id,v)=>{ const el=document.getElementById(id); if(el){ el.value=String(v); el.dispatchEvent(new Event('input',{bubbles:true})); } };
    if(enter) set('enter', enter);
    if(exit) set('exit', exit);
  }, { enter: process.env.ENTER ? +process.env.ENTER : undefined, exit: process.env.EXIT ? +process.env.EXIT : undefined });

  // Drive via URL to avoid headless file input quirks
  const videoHttpPath = '/' + videoPath.replace(/\\/g,'/').replace(/^\//,'');
  const videoUrl = new URL(videoHttpPath, url).toString();
  await page.evaluate(async (videoUrl) => {
    if(!window.__hex || !window.__hex.startVideoUrl) throw new Error('startVideoUrl not available');
    await window.__hex.startVideoUrl(videoUrl);
  }, videoUrl);

  // Wait until video starts playing to avoid reliance on status label
  await page.waitForFunction(() => {
    const v = document.getElementById('cam'); return v && !v.paused && !v.ended && v.currentTime > 0;
  }, { timeout: 60000 });

  await page.waitForFunction(() => {
    const v = document.getElementById('cam'); return v && (v.ended || v.paused);
  }, { timeout: 300000 });

  const golden = await page.evaluate(() => window.__getGolden ? window.__getGolden() : []);
  const telem = await page.evaluate(() => window.__getTelemetry ? window.__getTelemetry() : null);

  const outDir = path.resolve('tests/out');
  fs.mkdirSync(outDir, { recursive: true });
  const base = path.basename(absVideo).replace(/\.[^.]+$/, '');
  const outFile = path.join(outDir, base + '.jsonl');
  fs.writeFileSync(outFile, golden.join('\n')+'\n');
  console.log('Saved golden:', outFile);
  console.log('Telemetry:', telem);

  await browser.close();
}

main().catch(err=>{ console.error(err); process.exit(1); });
