// WEBWAY:ww-2025-095: Verify camera wrist-label state matches GestureRecognizer top label
import puppeteer from 'puppeteer';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clipPath = process.env.CLIP || 'September2025/TectangleHexagonal/videos/golden/golden.two_hands_idle.v1.mp4';
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v1.html`;

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

  // Wait until recognizer is present and first gesture arrives
  await page.waitForFunction(() => !!(window.__cam && window.__cam.hasGestureRecognizer && window.__cam.hasGestureRecognizer()), { timeout: 20000 });

  const deadline = Date.now() + 12000;
  let match = false;
  let last = { state:null, top:null };
  while(Date.now() < deadline){
    last = await page.evaluate(() => {
      const st = window.__cam?.getState?.() || null;
      const g = window.__cam?.getGesture?.();
      const top = (g && g.gestures && g.gestures[0] && g.gestures[0][0] && g.gestures[0][0].categoryName) || null;
      return { st, top };
    });
    if(last.st && last.top && last.st === last.top){ match = true; break; }
    await new Promise(r=>setTimeout(r, 250));
  }

  console.log(JSON.stringify({ page: pageUrl, clip: clipPath, observed: last, pass: match }, null, 2));
  await browser.close();
  if(!match) process.exit(1);
})();
