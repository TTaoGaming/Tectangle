// WEBWAY:ww-2025-109: Hex Panel — MediaPipe Pipeline controls + live stats
// WEBWAY:ww-2025-111: Stub adds data-testid and __wbTest markers for e2e
function createStubWinbox(title='Window', width=520, height=360, testId){
  if (typeof document==='undefined') return null;
  try{
    const root = document.createElement('div'); root.className='winbox wb-dark';
    const header=document.createElement('div'); header.className='wb-header';
    const t=document.createElement('div'); t.className='wb-title'; t.textContent=title;
    const body=document.createElement('div'); body.className='wb-body';
    header.appendChild(t); root.appendChild(header); root.appendChild(body);
    root.style.position='fixed'; root.style.right='16px'; root.style.top='64px';
    root.style.width=(width+'px'); root.style.height=(height+'px'); root.style.border='1px solid rgba(255,255,255,0.12)'; root.style.background='#0f172a';
    if (testId) { try { root.setAttribute('data-testid', testId); } catch {} }
    document.body.appendChild(root);
    try { window.__wbTest = window.__wbTest || {}; if (testId) { const k = testId.replace('winbox-',''); window.__wbTest[k] = true; } } catch {}
    return { dom: root, body, onclose: null, close: ()=>{ try{ root.remove(); }catch{} } };
  }catch{ return null; }
}

export async function openMediapipePanel(){
  let wb;
  try {
    const { createWinBoxWindow } = await import('../winBoxHost.js');
    // Create the window immediately so e2e can observe the title promptly
    wb = await createWinBoxWindow({ title: 'MediaPipe Pipeline', width: 520, height: 360 });
    try{ wb?.dom?.setAttribute?.('data-testid','winbox-mediapipe'); }catch{}
  } catch {
    wb = createStubWinbox('MediaPipe Pipeline', 520, 360, 'winbox-mediapipe');
    if (!wb) throw new Error('Failed to open MediaPipe panel');
  }
  wb?.dom?.classList?.add('wb-dark');
  // Progressive enhance Material components without blocking window creation
  let ensure;
  try {
    const { preloadMaterialDefaults, ensureMaterialComponent } = await import('../materialWeb.js');
    await preloadMaterialDefaults();
    ensure = ensureMaterialComponent;
    await ensure('md-switch');
    await ensure('md-slider');
    await ensure('md-text-button');
  } catch {}

  const root = document.createElement('div');
  root.style.padding = '10px';
  root.style.font = '13px system-ui,Segoe UI,Roboto,Arial';
  root.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
      <strong>MediaPipe</strong>
      <span id="status" style="opacity:0.85;font-size:12px">—</span>
      <span style="margin-left:auto;opacity:0.8;font-size:12px">FPS <span id="fps">–</span></span>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <div style="min-width:220px">
        <div style="margin-bottom:8px"><md-switch id="swT1" icons></md-switch> <label for="swT1">Tracker T1 (FEATURE_HEX_HAND_TRACKER_T1)</label></div>
        <div style="margin-bottom:8px"><md-switch id="swT1Req" icons></md-switch> <label for="swT1Req">Require T1 (FEATURE_T1_TRACKER_REQUIRED)</label></div>
        <div style="margin-bottom:8px"><md-switch id="swGuard" icons></md-switch> <label for="swGuard">HandId Guard (FEATURE_TELEM_HANDID_GUARD)</label></div>
        <div style="margin-top:12px"><md-text-button id="btnReset">Reset Tracker</md-text-button></div>
      </div>
      <div style="flex:1;min-width:240px">
        <div style="margin-bottom:6px">Hands: <span id="hands">0</span> • With IDs: <span id="withIds">0</span> • Null IDs (acc): <span id="nullIds">0</span></div>
        <div style="margin-bottom:6px">Seats: <span id="seats">{}</span></div>
        <div><pre id="stats" style="margin:0;max-height:180px;overflow:auto;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px"></pre></div>
      </div>
    </div>
  `;
  wb?.body?.appendChild(root);

  const $ = (sel)=> root.querySelector(sel);
  const el = {
    status: $('#status'), fps: $('#fps'), hands: $('#hands'), withIds: $('#withIds'), nullIds: $('#nullIds'), seats: $('#seats'), stats: $('#stats'),
    swT1: $('#swT1'), swT1Req: $('#swT1Req'), swGuard: $('#swGuard'), btnReset: $('#btnReset')
  };

  // Initialize switches from window flags
  const w = window;
  const readBool = (v, d=false)=> (typeof v==='boolean' ? v : d);
  el.swT1.selected = readBool(w.FEATURE_HEX_HAND_TRACKER_T1, false);
  el.swT1Req.selected = readBool(w.FEATURE_T1_TRACKER_REQUIRED, false);
  el.swGuard.selected = (w.FEATURE_TELEM_HANDID_GUARD ?? true) ? true : false;

  el.swT1.addEventListener('change', ()=>{ w.FEATURE_HEX_HAND_TRACKER_T1 = !!el.swT1.selected; });
  el.swT1Req.addEventListener('change', ()=>{ w.FEATURE_T1_TRACKER_REQUIRED = !!el.swT1Req.selected; });
  el.swGuard.addEventListener('change', ()=>{ w.FEATURE_TELEM_HANDID_GUARD = !!el.swGuard.selected; });
  el.btnReset.addEventListener('click', ()=>{ try{ w.__hexMedia?.resetHandTracker?.(); }catch{} });

  // Live polling of stats from MediaPipe port globals
  let timer = null; let lastTs = 0; let fpsEMA = 0; const alpha=0.2;
  function sample(){
    try{
      const now = performance.now(); const dt = now - (lastTs || now); lastTs = now; if(dt>0 && dt<1000) fpsEMA = fpsEMA? (fpsEMA*(1-alpha) + (1000/dt)*alpha) : (1000/dt);
      const dets = w.__hexLastDetections || null; const handsRaw = w.__hexLastHands || null;
      const nHands = Array.isArray(handsRaw) ? handsRaw.length : (Array.isArray(dets)? dets.length : 0);
      const withIds = Array.isArray(dets) ? dets.filter(d=> d && d.handId!=null).length : 0;
      const nullAcc = Number(w.__hexHandIdNullFrames||0) || 0;
      const seatStr = JSON.stringify(w.__hexSeats || w.__cam?.getSeat?.() || {}, null, 0);
      const trackerStats = (w.__hexMedia && w.__hexMedia.getHandTrackerStats) ? w.__hexMedia.getHandTrackerStats() : null;
      el.status.textContent = `${Array.isArray(dets)?'video':'camera'} • tracker:${w.FEATURE_HEX_HAND_TRACKER_T1?'on':'off'}`;
      el.fps.textContent = fpsEMA? fpsEMA.toFixed(1) : '–';
      el.hands.textContent = String(nHands);
      el.withIds.textContent = String(withIds);
      el.nullIds.textContent = String(nullAcc);
      el.seats.textContent = seatStr;
      el.stats.textContent = trackerStats ? JSON.stringify(trackerStats, null, 2) : 'tracker: n/a';
    }catch{}
  }
  timer = setInterval(sample, 250);
  wb.onclose = ()=>{ if(timer) clearInterval(timer); };
}
