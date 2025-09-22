// Generate landmarks JSONL by running the hex dev page on an MP4
// Usage:
//   DEMO_URL=http://localhost:8080/September2025/TectangleHexagonal/dev/index.html \
//   node tests/replay/generate_landmarks_from_video.cjs September2025/TectangleHexagonal/videos/samples/right_hand_normal.mp4
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function main(){
  const videoPath = process.argv[2];
  if(!videoPath){ console.error('Provide a video path'); process.exit(2); }
  const absVideo = path.resolve(videoPath);
  if(!fs.existsSync(absVideo)){ console.error('Video not found:', absVideo); process.exit(2); }

  const url = process.env.DEMO_URL || 'http://localhost:8080/September2025/TectangleHexagonal/dev/index.html';
  const browser = await puppeteer.launch({ headless: 'new', args:[ '--autoplay-policy=no-user-gesture-required' ] });
  const page = await browser.newPage();
  page.on('console', msg => { try { console.log('[page]', msg.type(), msg.text()); } catch {} });
  page.on('pageerror', err => { console.error('[pageerror]', err?.message||err); });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Wait until app module is loaded and helper is available
  await page.waitForFunction(() => window.__hex && typeof window.__hex.processVideoUrl === 'function', { timeout: 60000 });

  // One-call capture on page; resolves when video ends
  const videoHttpPath = '/' + videoPath.replace(/\\/g,'/').replace(/^\//,'');
  const videoUrl = new URL(videoHttpPath, url).toString();
  const result = await page.evaluate(async (videoUrl) => {
    if(!window.__hex || !window.__hex.processVideoUrl) throw new Error('processVideoUrl not available');
    return await window.__hex.processVideoUrl(videoUrl);
  }, videoUrl);

  const outDir = path.resolve('tests/landmarks'); fs.mkdirSync(outDir, { recursive: true });
  const base = path.basename(absVideo).replace(/\.[^.]+$/, '');
  const lmFile = path.join(outDir, base + '.landmarks.jsonl');
  fs.writeFileSync(lmFile, (result.landmarks||[]).join('\n')+'\n');
  const outDir2 = path.resolve('tests/out'); fs.mkdirSync(outDir2, { recursive: true });
  const goldFile = path.join(outDir2, base + '.golden.jsonl');
  fs.writeFileSync(goldFile, (result.golden||[]).join('\n')+'\n');
  const teleFile = path.join(outDir2, base + '.telemetry.json');
  fs.writeFileSync(teleFile, JSON.stringify(result.telemetry||{}, null, 2));
  console.log('Saved landmarks:', lmFile, 'lines=', (result.landmarks||[]).length);
  console.log('Saved golden:', goldFile, 'lines=', (result.golden||[]).length);
  console.log('Saved telemetry:', teleFile);

  await browser.close();
}

main().catch(err=>{ console.error(err); process.exit(1); });
