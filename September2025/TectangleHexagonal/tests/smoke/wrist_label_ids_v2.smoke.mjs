// Smoke: assert stable IDs present and consistent over idle golden clip
import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clipPath = process.env.CLIP || 'September2025/TectangleHexagonal/videos/golden/golden.two_hands_idle.v1.mp4';
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v2.html`;
const outSummary = process.env.OUT || 'September2025/TectangleHexagonal/out/wrist_label_v2.ids.summary.json';

(async () => {
  const headless = (process.env.HEADLESS === '0' || process.env.HEADFUL === '1') ? false : 'new';
  let executablePath = process.env.CHROME || process.env.PUPPETEER_EXECUTABLE_PATH;
  try { if(!executablePath && process.platform==='win32') { const p='C:/Program Files/Google/Chrome/Application/chrome.exe'; const fs2 = await import('node:fs'); if(fs2.existsSync(p)) executablePath = p; } } catch {}
  const launchOpts = { headless, args: ['--autoplay-policy=no-user-gesture-required'] };
  if(executablePath) launchOpts.executablePath = executablePath;
  const browser = await puppeteer.launch(launchOpts);
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  const mockUrl = `${base}/${clipPath.replace(/^\/+/, '')}`;
  await page.evaluateOnNewDocument((url) => {
    const ensureVideo = async () => {
      if (navigator.__mockVideoEl) return navigator.__mockVideoEl;
      const v = document.createElement('video');
      v.src = url; v.muted = true; v.playsInline = true; v.setAttribute('playsinline',''); v.style.cssText='position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;';
      document.addEventListener('DOMContentLoaded', ()=>{ try{ document.body.appendChild(v); }catch{} });
      try{ await v.play(); }catch{}
      if (!v.readyState || v.readyState < 2) {
        await new Promise(r => v.addEventListener('loadeddata', r, { once:true }));
      }
      navigator.__mockVideoEl = v; return v;
    };
    const orig = (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices) : null;
    const shim = async (constraints) => {
      try{
        const v = await ensureVideo();
        const ms = v.captureStream ? v.captureStream() : (v.mozCaptureStream ? v.mozCaptureStream() : null);
        if(!ms) throw new Error('captureStream not supported');
        return ms;
      }catch(e){ if(orig) return orig(constraints); throw e; }
    };
    if(!navigator.mediaDevices) navigator.mediaDevices = {};
    navigator.mediaDevices.getUserMedia = shim;
    window.__mockInstalled = true;
  }, mockUrl);

  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

  const deadline = Date.now() + 12000;
  let fpsVal = 0;
  while(Date.now() < deadline){
    fpsVal = await page.evaluate(() => parseFloat(document.getElementById('fps')?.textContent || '0') || 0);
    if(fpsVal > 0.1) break;
    await new Promise(r=>setTimeout(r,200));
  }

  // Sample stable ids over time
  const samples = [];
  const sampleN = 8;
  for(let i=0;i<sampleN;i++){
    const ids = await page.evaluate(() => (window.__cam && typeof window.__cam.getStableIds==='function') ? window.__cam.getStableIds() : []);
    samples.push(ids);
    await new Promise(r=>setTimeout(r,150));
  }

  // Evaluate stability: non-empty, mostly consistent across time when idle
  const nonEmpty = samples.some(arr => Array.isArray(arr) && arr.some(x => !!x));
  const width = samples[0]?.length || 0;
  let consistent = true;
  for(let col=0; col<width; col++){
    const first = samples.find(s => s[col])?.[col] || null;
    if(!first) continue;
    for(const s of samples){ if(s[col] && s[col] !== first){ consistent = false; break; } }
    if(!consistent) break;
  }

  const summary = { page: pageUrl, clip: clipPath, fps: fpsVal, nonEmptyIds: nonEmpty, consistentIds: consistent, pass: fpsVal>0.1 && nonEmpty && consistent };
  await fs.mkdir(outSummary.substring(0, outSummary.lastIndexOf('/')), { recursive: true }).catch(()=>{});
  await fs.writeFile(outSummary, JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
  if(!summary.pass){ process.exit(1); }
})();
