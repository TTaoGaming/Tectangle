// WEBWAY:ww-2025-008: v3 Kalman telemetry runner for MP4 clips
// Usage (env): SITE_BASE=http://127.0.0.1:8080 CLIP=... LA=100 node .../run_v3_kalman_telemetry.mjs
import puppeteer from 'puppeteer';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const clipPath = process.env.CLIP || 'September2025/TectangleHexagonal/videos/right_hand_index_pinch_two_slow_then_two_fast.mp4';
const lookaheadMs = Number.isFinite(+process.env.LA) ? +process.env.LA : 100;

const pageUrl = `${base}/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v3_kalman.html`;

(async () => {
  const headless = (process.env.HEADLESS === '0' || process.env.HEADFUL === '1') ? false : 'new';
  // Prefer system Chrome on Windows for H.264 mp4 playback
  const fs = await import('node:fs');
  const guessChromeWin = 'C\\\Program Files\\\Google\\\Chrome\\\Application\\\chrome.exe';
  let executablePath = process.env.CHROME || process.env.PUPPETEER_EXECUTABLE_PATH;
  try { if(!executablePath && process.platform==='win32' && fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')) executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'; } catch {}
  const launchOpts = { headless, args: ['--autoplay-policy=no-user-gesture-required'] };
  if(executablePath) launchOpts.executablePath = executablePath;
  const browser = await puppeteer.launch(launchOpts);
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

  // Ensure SDK exists and set demo flag + lookahead
  await page.waitForFunction(() => !!(globalThis.__sdk), { timeout: 20000 });
  await page.evaluate((la) => {
    // Enable Kalman feature flag in demo context
    globalThis.__flags = globalThis.__flags || {}; globalThis.__flags['FEATURE_SDK_V3_KALMAN_TOI'] = true;
    const ff = document.getElementById('ff_kalman'); if(ff){ ff.checked = true; ff.dispatchEvent(new Event('change', { bubbles:true })); }
    const laEl = document.getElementById('la'); if(laEl){ laEl.value = String(la); laEl.dispatchEvent(new Event('change', { bubbles:true })); }
  }, lookaheadMs);

  // Wire listeners to capture pinch events and telemetry
  await page.exposeFunction('nodeLog', (...args) => console.log('[page]', ...args));
  await page.evaluate(() => {
    const events = [];
    const sdk = globalThis.__sdk;
    // WEBWAY:ww-2025-042: include hand/handId/seat to analyze seat locks from events
    function pick(e){
      return {
        type: e?.type,
        t: e?.t,
        hand: e?.hand || null,
        handId: (typeof e?.handId === 'number') ? e.handId : null,
        seat: e?.seat || null,
        speculative: !!e?.speculative,
        vRel: (typeof e?.vRel === 'number') ? e.vRel : null,
        aRel: (typeof e?.aRel === 'number') ? e.aRel : null,
        norm: (typeof e?.norm === 'number') ? e.norm : null,
        toiPredAbsV: (typeof e?.toiPredAbsV === 'number') ? Math.round(e.toiPredAbsV) : null,
        toiPredAbsA: (typeof e?.toiPredAbsA === 'number') ? Math.round(e.toiPredAbsA) : null,
        toiActualEnterAbs: (typeof e?.toiActualEnterAbs === 'number') ? Math.round(e.toiActualEnterAbs) : null,
        palmAngleDeg: (typeof e?.palmAngleDeg === 'number') ? e.palmAngleDeg : null,
      };
    }
    if(sdk && typeof sdk.on === 'function'){
      sdk.on((e)=>{ if(e && (e.type==='pinch:down' || e.type==='pinch:up')) events.push(pick(e)); });
    }
    // stash for later retrieval
    globalThis.__telemetryEvents = events;
  });

  // Start the video on the page via SDK
  const url = `${base}/${clipPath.replace(/^\/+/, '')}`;
  await page.evaluate(async (u) => {
    const video = document.getElementById('cam');
    // Loosen palm gate to avoid orientation blocks for headless runs
    try{ globalThis.__sdk.updatePinchConfig && globalThis.__sdk.updatePinchConfig({ palmGate:false }); }catch{}
    await globalThis.__sdk.startVideoUrl(video, u);
  }, url);

  // Wait for video metadata and some playback progression
  try {
    await page.waitForFunction(() => {
      const v = document.getElementById('cam');
      return v && v.readyState >= 2;
    }, { timeout: 15000 });
  } catch {}
  const startCT = await page.evaluate(() => (document.getElementById('cam')?.currentTime || 0));
  const progDeadline = Date.now() + 10000;
  while(Date.now() < progDeadline){
    const ct = await page.evaluate(() => (document.getElementById('cam')?.currentTime || 0));
    if(ct > startCT + 0.5) break;
    await new Promise(r=> setTimeout(r, 200));
  }

  // Wait until MediaPipe reports at least one hand frame to the page
  try {
    await page.waitForFunction(() => Array.isArray(globalThis.__hexLastHands) && globalThis.__hexLastHands.length > 0, { timeout: 20000 });
  } catch {}

  // Wait until we see at least 4 downs and 4 ups or timeout
  const deadline = Date.now() + 45000;
  let complete = false;
  while(Date.now() < deadline){
    const counts = await page.evaluate(() => {
      const ev = globalThis.__telemetryEvents || [];
      let down=0, up=0; for(const e of ev){ if(e.type==='pinch:down') down++; if(e.type==='pinch:up') up++; }
      return { down, up, total: ev.length };
    });
    if(counts.down >= 4 && counts.up >= 4){ complete = true; break; }
    await new Promise(r=>setTimeout(r, 500));
  }

  // Pull events and analyze
  const data = await page.evaluate(() => ({
    events: globalThis.__telemetryEvents || [],
    la: +(document.getElementById('la')?.value||0),
    handIdNullFrames: (globalThis.__hexHandIdNullFrames||0), // WEBWAY:ww-2025-078
  }));
  const downs = data.events.filter(e=>e.type==='pinch:down' && !e.speculative);
  const ups = data.events.filter(e=>e.type==='pinch:up');
  const seatInfo = await page.evaluate(() => {
    try{
      const st = globalThis.__sdk && globalThis.__sdk.getState && globalThis.__sdk.getState();
      const seats = (st && (st.seats?.seats || st.seats)) || {};
      const used = new Set();
      const bySeat = {};
      if (Array.isArray(seats)){
        for (const s of seats){ if(s && s.seat){ used.add(s.seat); bySeat[s.seat] = s; } }
      } else if (typeof seats === 'object' && seats){
        for (const s of Object.values(seats)){ if(s && s.seat){ used.add(s.seat); bySeat[s.seat] = s; } }
      }
      return { used: Array.from(used), bySeat };
    }catch{ return { used: [], bySeat: {} }; }
  });

  function summarizeVelocity(evts){
    const v = evts.map(e=>e.vRel).filter(x=>typeof x==='number');
    if(!v.length) return { count:0, values:[], mean:null };
    const mean = v.reduce((a,b)=>a+b,0)/v.length;
    return { count: v.length, values: v, mean };
  }
  const vDown = summarizeVelocity(downs);
  const vUp = summarizeVelocity(ups);

  function classifyTwoSlowTwoFast(vals){
    if(vals.length < 4) return { ok:false, reason:'<4 events' };
    const firstTwo = vals.slice(0,2).map(Math.abs);
    const lastTwo  = vals.slice(2,4).map(Math.abs);
    const m1 = firstTwo.reduce((a,b)=>a+b,0)/firstTwo.length;
    const m2 = lastTwo.reduce((a,b)=>a+b,0)/lastTwo.length;
    const ratio = (m2>0)? (m1/m2) : 0; // slow has smaller |v|
    return { ok: m1 < m2*0.7, m1, m2, ratio };
  }
  const downClass = classifyTwoSlowTwoFast(vDown.values);

  const toiActuals = downs.map(d=>d.toiActualEnterAbs).filter(x=>typeof x==='number');
  const toiPredsV = downs.map(d=>d.toiPredAbsV).filter(x=>typeof x==='number');
  const toiErrs = (toiActuals.length===toiPredsV.length) ? toiActuals.map((a,i)=> a - toiPredsV[i]) : [];

  const summary = {
    page: pageUrl,
    clip: clipPath,
    lookaheadMs,
    complete,
    counts: { downs: downs.length, ups: ups.length },
    handIdNullFrames: data.handIdNullFrames,
    velocities: {
      down: vDown,
      up: vUp,
      twoSlowThenTwoFast: downClass,
    },
    toi: {
      actualEnterAbs: toiActuals,
      predAbsV: toiPredsV,
      errVsPredV: toiErrs,
    },
    seats: seatInfo
  };

  console.log(JSON.stringify(summary, null, 2));
  // Guard: if FEATURE_TELEM_HANDID_GUARD is enabled (default true), fail on any handId-null frames during golden runs
  if(summary.handIdNullFrames > 0 && process.env.TELEM_GUARD !== '0'){
    console.error('[guard] handIdNullFrames > 0:', summary.handIdNullFrames);
    await browser.close();
    process.exit(1);
  }
  await browser.close();
})();
