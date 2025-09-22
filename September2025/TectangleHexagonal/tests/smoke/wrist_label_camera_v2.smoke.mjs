// Smoke test: camera_landmarks_wrist_label_v2.html
import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clipPath = process.env.CLIP || 'September2025/TectangleHexagonal/videos/golden/golden.two_hands_idle.v1.mp4';
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v2.html`;
const outSummary = process.env.OUT || 'September2025/TectangleHexagonal/out/wrist_label_v2.smoke.summary.json';

(async () => {
  const headless = (process.env.HEADLESS === '0' || process.env.HEADFUL === '1') ? false : 'new';
  let executablePath = process.env.CHROME || process.env.PUPPETEER_EXECUTABLE_PATH;
  try { if(!executablePath && process.platform==='win32') { const p='C:/Program Files/Google/Chrome/Application/chrome.exe'; const fs2 = await import('node:fs'); if(fs2.existsSync(p)) executablePath = p; } } catch {}
  const launchOpts = { headless, args: ['--autoplay-policy=no-user-gesture-required'] };
  if(executablePath) launchOpts.executablePath = executablePath;
  const browser = await puppeteer.launch(launchOpts);
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  // Provide mock video URL to init script
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

  const deadline = Date.now() + 8000;
  let fpsVal = 0;
  while(Date.now() < deadline){
    fpsVal = await page.evaluate(() => parseFloat(document.getElementById('fps')?.textContent || '0') || 0);
    if(fpsVal > 0.1) break;
    await new Promise(r=>setTimeout(r,250));
  }

  const overlayHasInk = await page.evaluate(() => {
    const cv = document.getElementById('overlay');
    if(!cv) return false; const g = cv.getContext('2d'); if(!g) return false;
    try{
      const W = cv.width|0, H=cv.height|0; if(W<2||H<2) return false;
      const img = g.getImageData(0,0,Math.min(320,W), Math.min(180,H));
      const d = img.data; for(let i=3;i<d.length;i+=4){ if(d[i] > 0) return true; }
      return false;
    }catch{ return false; }
  });

  const summary = { page: pageUrl, clip: clipPath, fps: fpsVal, overlayHasInk, pass: fpsVal > 0.1 };
  await fs.mkdir(outSummary.substring(0, outSummary.lastIndexOf('/')), { recursive: true }).catch(()=>{});
  await fs.writeFile(outSummary, JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
  if(!summary.pass){ process.exit(1); }
})();
