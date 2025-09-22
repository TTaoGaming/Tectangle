/*
Run: SITE_BASE=http://127.0.0.1:8091 node September2025/TectangleHexagonal/tests/smoke/run_v6_lockin.js
*/
import puppeteer from 'puppeteer';

async function main(){
  const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
  const clip = process.env.CLIP || 'September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
  const url = `${base}/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v6_material.html?autostart=1&clip=${encodeURIComponent(clip)}`;
  const browser = await puppeteer.launch({ headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  page.on('console', m=> console.log('[page]', m.type(), m.text()));
  await page.goto(url, { waitUntil:'networkidle2', timeout: 60000 });
  // Poll for lock-in up to 60s
  let summary=null; const start=Date.now();
  while(Date.now()-start < 60000){
    summary = await page.evaluate(()=> globalThis.__lockSummary && globalThis.__lockSummary());
    if(summary && summary.P1 && summary.P2) break;
    await new Promise(r=> setTimeout(r, 1000));
  }
  console.log('LOCK_SUMMARY:', JSON.stringify(summary, null, 2));
  await browser.close();
  if(!summary){ console.error('No lock summary available'); process.exit(2); }
  if(!summary.P1 || !summary.P2){ console.error('Expected P1 and P2 lock-in (1/1 each)'); process.exit(3); }
  console.log('OK: P1 and P2 lock-in observed');
}

main().catch(e=>{ console.error(e); process.exit(1); });
