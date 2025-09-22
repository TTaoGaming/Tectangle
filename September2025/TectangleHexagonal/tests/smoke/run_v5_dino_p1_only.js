/*
Run: node September2025/TectangleHexagonal/tests/smoke/run_v5_dino_p1_only.js
Optionally set CLIP env to override the MP4 path
*/
import puppeteer from 'puppeteer';

async function main(){
  const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
  const clip = process.env.CLIP || 'September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
  const url = `${base}/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v5_material.html?dino=1&launch=1&autostart=1&clip=${encodeURIComponent(clip)}&la=100`;
  const browser = await puppeteer.launch({ headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  page.on('console', m=> console.log('[page]', m.type(), m.text()));
  await page.goto(url, { waitUntil:'networkidle2', timeout: 60000 });
  // Ensure playback
  try { await page.click('#btnPlayPinch'); } catch {}
  // Probe SDK pinch events for visibility
  await page.evaluate(()=>{
    window.__probe = { downs:0, ups:0 };
    try{
      window.__sdk?.on('pinch:down', ()=> window.__probe.downs++);
      window.__sdk?.on('pinch:up', ()=> window.__probe.ups++);
    }catch{}
  });
  // Poll summary up to 60s
  let summary=null;
  const start=Date.now();
  while(Date.now()-start < 60000){
    summary = await page.evaluate(()=> window.__dino && window.__dino.getSummary && window.__dino.getSummary());
    if(summary && summary.downs>0) break;
    await new Promise(r=> setTimeout(r, 1000));
  }
  const probe = await page.evaluate(()=> window.__probe || null);
  console.log('DINO_SUMMARY:', JSON.stringify(summary, null, 2));
  console.log('SDK_PROBE:', JSON.stringify(probe, null, 2));
  await browser.close();
  if(!summary){ console.error('No summary available'); process.exit(2); }
  if(summary.downs<=0){ console.error('No P1 downs detected'); process.exit(3); }
  console.log('OK: P1-only sidecar produced downs, rejectedBySeat=', summary.rejectedBySeat);
}

main().catch(e=>{ console.error(e); process.exit(1); });
