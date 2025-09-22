// WEBWAY:ww-2025-095: Open_Palm idle CI guard against golden idle clip
// Usage: SITE_BASE=http://127.0.0.1:8080 CLIP=... OUT_JSONL=... OUT_SUMMARY=... node open_palm_idle_ci.mjs
import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clipPath = process.env.CLIP || 'September2025/TectangleHexagonal/videos/golden/golden.two_hands_idle.v1.mp4';
const outJsonl = process.env.OUT_JSONL || 'September2025/TectangleHexagonal/out/open_palm_idle.jsonl';
const outSummary = process.env.OUT_SUMMARY || 'September2025/TectangleHexagonal/out/open_palm_idle.summary.json';
const minFramesTwoHands = Number.isFinite(+process.env.MIN_TWO_HANDS_FRAMES) ? +process.env.MIN_TWO_HANDS_FRAMES : 1;
const minOpenPalmFrames = Number.isFinite(+process.env.MIN_OPENPALM_FRAMES) ? +process.env.MIN_OPENPALM_FRAMES : 1;
const openPalmThresh = Number.isFinite(+process.env.OPENPALM_THRESH) ? +process.env.OPENPALM_THRESH : 0.50;

const pageUrl = `${base}/September2025/TectangleHexagonal/dev/gesture_tasks_offline_v3.html`;

function analyze(rows){
  let twoHandsFrames = 0;
  let leftFrames = 0, rightFrames = 0;
  let leftDurMs = 0, rightDurMs = 0;
  let leftScores = [], rightScores = [];

  for(let i=0;i<rows.length;i++){
    const r = rows[i]||{};
    const dt = (typeof r.dt==='number' ? r.dt : 0);
    const per = Array.isArray(r.per) ? r.per : [];
    const perCount = per.filter(p=>p && (p.label || typeof p.score==='number')).length;
    if(perCount >= 2) twoHandsFrames++;
    for(const p of per){
      if(!p || typeof p.score !== 'number' || p.score < openPalmThresh) continue;
      if(p.label !== 'Open_Palm') continue;
      if(p.handed === 'Left'){ leftFrames++; leftDurMs += dt; leftScores.push(p.score); }
      if(p.handed === 'Right'){ rightFrames++; rightDurMs += dt; rightScores.push(p.score); }
    }
  }
  const sum = arr => arr.reduce((a,b)=>a+b,0);
  const avg = arr => arr.length ? (sum(arr)/arr.length) : null;
  return {
    totalFrames: rows.length,
    twoHandsFrames,
    openPalm: {
      left: { frames: leftFrames, seconds: +(leftDurMs/1000).toFixed(3), count: leftScores.length, meanScore: avg(leftScores) },
      right: { frames: rightFrames, seconds: +(rightDurMs/1000).toFixed(3), count: rightScores.length, meanScore: avg(rightScores) }
    },
    assertions: {
      twoHandsAny: twoHandsFrames >= minFramesTwoHands,
      openPalmLeftAny: leftFrames >= minOpenPalmFrames,
      openPalmRightAny: rightFrames >= minOpenPalmFrames
    }
  };
}

(async () => {
  const headless = (process.env.HEADLESS === '0' || process.env.HEADFUL === '1') ? false : 'new';
  // Prefer system Chrome on Windows for H.264 mp4 playback
  let executablePath = process.env.CHROME || process.env.PUPPETEER_EXECUTABLE_PATH;
  try { if(!executablePath && process.platform==='win32') { const p='C:/Program Files/Google/Chrome/Application/chrome.exe'; const fs2 = await import('node:fs'); if(fs2.existsSync(p)) executablePath = p; } } catch {}
  const launchOpts = { headless, args: ['--autoplay-policy=no-user-gesture-required'] };
  if(executablePath) launchOpts.executablePath = executablePath;
  const browser = await puppeteer.launch(launchOpts);
  try{
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

    // Build query URL and start playback
  const url = `${base}/${clipPath.replace(/^\/+/, '')}`;
  const withParams = `${pageUrl}?video=${encodeURIComponent(url)}&auto=1&autoExport=1&idle=Open_Palm&target=Closed_Fist&hands=2`;
    await page.goto(withParams, { waitUntil: 'domcontentloaded' });

    // Wait for hooks
    await page.waitForFunction(() => !!(window.__v3), { timeout: 20000 });

    // Wait for end (or timeout) while ensuring some frames processed
    const deadline = Date.now() + 60000;
    while(Date.now() < deadline){
      const state = await page.evaluate(() => ({ rows: (window.__v3?.getRows?.()||[]).length, ended: !!window.__v3?.isEnded?.() }));
      if(state.ended && state.rows > 0) break;
      await new Promise(r=>setTimeout(r, 300));
    }

    // Pull data
    const { rows, jsonl } = await page.evaluate(() => ({ rows: window.__v3?.getRows?.()||[], jsonl: window.__v3?.getJsonl?.()||'' }));

    // Analyze
    const summary = analyze(rows);
    summary.page = pageUrl;
    summary.clip = clipPath;
    summary.thresholds = { openPalmThresh, minFramesTwoHands, minOpenPalmFrames };

    // Write artifacts
    await fs.mkdir(outJsonl.substring(0, outJsonl.lastIndexOf('/')), { recursive: true }).catch(()=>{});
    await fs.writeFile(outJsonl, jsonl || '', 'utf8');
    await fs.mkdir(outSummary.substring(0, outSummary.lastIndexOf('/')), { recursive: true }).catch(()=>{});
    await fs.writeFile(outSummary, JSON.stringify(summary, null, 2), 'utf8');

    console.log(JSON.stringify(summary, null, 2));

    // Guards
    if(!summary.assertions.twoHandsAny){ console.error('[guard] expected two hands at least once'); process.exitCode = 1; }
    if(!summary.assertions.openPalmLeftAny || !summary.assertions.openPalmRightAny){ console.error('[guard] Open_Palm did not appear on both hands'); process.exitCode = 1; }
  } finally {
    await browser.close();
  }
})();
