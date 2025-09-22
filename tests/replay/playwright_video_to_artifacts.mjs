// Playwright runner: drive the hex dev page to process an MP4 and save artifacts
// Usage:
//   DEMO_URL=http://localhost:8080/September2025/TectangleHexagonal/dev/index.html \
//   node tests/replay/playwright_video_to_artifacts.mjs September2025/TectangleHexagonal/videos/samples/right_hand_normal.mp4
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function main(){
  const videoPath = process.argv[2];
  if(!videoPath){ console.error('Provide a video path'); process.exit(2); }
  const absVideo = path.resolve(videoPath);
  if(!fs.existsSync(absVideo)){ console.error('Video not found:', absVideo); process.exit(2); }
  const url = process.env.DEMO_URL || 'http://localhost:8080/September2025/TectangleHexagonal/dev/index.html';

  let browser;
  try {
    // Prefer system Chrome for H.264 support
    browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--autoplay-policy=no-user-gesture-required'] });
  } catch(e) {
    // Fallback to bundled Chromium
    browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required','--use-gl=swiftshader','--disable-gpu-sandbox','--no-sandbox'] });
  }
  const page = await browser.newPage();
  page.on('console', msg => { try { console.log('[page]', msg.type(), msg.text()); } catch {} });
  page.on('pageerror', err => { console.error('[pageerror]', err?.message||err); });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__hexReady === true, { timeout: 120000 });

  const videoHttpPath = '/' + videoPath.replace(/\\/g,'/').replace(/^\//,'');
  const videoUrl = new URL(videoHttpPath, url).toString();
  const result = await page.evaluate(async (videoUrl) => {
    if(!window.__hex || !window.__hex.processVideoUrl) throw new Error('processVideoUrl not available');
    return await window.__hex.processVideoUrl(videoUrl);
  }, videoUrl);

  const outLmDir = path.resolve('tests/landmarks'); fs.mkdirSync(outLmDir, { recursive: true });
  const outDir = path.resolve('tests/out'); fs.mkdirSync(outDir, { recursive: true });
  const base = path.basename(absVideo).replace(/\.[^.]+$/, '');
  const lmFile = path.join(outLmDir, base + '.landmarks.jsonl');
  const goldFile = path.join(outDir, base + '.golden.jsonl');
  const teleFile = path.join(outDir, base + '.telemetry.json');
  fs.writeFileSync(lmFile, (result.landmarks||[]).join('\n')+'\n');
  fs.writeFileSync(goldFile, (result.golden||[]).join('\n')+'\n');
  fs.writeFileSync(teleFile, JSON.stringify(result.telemetry||{}, null, 2));
  console.log('Saved landmarks:', lmFile, 'lines=', (result.landmarks||[]).length);
  console.log('Saved golden:', goldFile, 'lines=', (result.golden||[]).length);
  console.log('Saved telemetry:', teleFile);

  await browser.close();
}

main().catch(err=>{ console.error(err); process.exit(1); });
