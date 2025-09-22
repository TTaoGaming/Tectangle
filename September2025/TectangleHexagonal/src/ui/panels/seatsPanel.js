// Seats Panel — 4 tracks, per-seat OneEuro toggles (stub-friendly)
export async function openSeatsPanel(){
  let wb;
  try { const { createWinBoxWindow } = await import('../winBoxHost.js'); wb = await createWinBoxWindow({ title:'Seats (Tracks x4)', width:540, height:420 }); wb?.dom?.setAttribute?.('data-testid','winbox-seats'); }
  catch { wb = createStub('Seats (Tracks x4)', 'winbox-seats'); }
  const root = document.createElement('div');
  root.style.cssText='padding:10px;font:13px system-ui,Segoe UI,Roboto,Arial;color:#e5e7eb;';
  const ensure = await ensureMaterial();
  root.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><strong>Seat Tracks</strong><span style="opacity:0.8;font-size:12px">P1–P4</span></div>
    <div id="grid" style="display:grid;grid-template-columns:repeat(2,minmax(240px,1fr));gap:12px"></div>
  `;
  wb.body.appendChild(root);
  const grid = root.querySelector('#grid');
  const seats = ['P1','P2','P3','P4'];
  seats.forEach(id => {
    const card = document.createElement('div');
    card.style.cssText='border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:10px;background:rgba(0,0,0,0.3)';
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><strong>${id}</strong><span id="status-${id}" style="opacity:0.8;font-size:12px">idle</span></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><md-switch id="oe-${id}" icons></md-switch><label for="oe-${id}">OneEuro (per-seat)</label></div>
      <div style="display:flex;align-items:center;gap:8px"><md-switch id="kf-${id}" icons></md-switch><label for="kf-${id}">Kalman lookahead</label></div>
    `;
    grid.appendChild(card);
    const swOE = card.querySelector(`#oe-${id}`);
    const swKF = card.querySelector(`#kf-${id}`);
    const W = window; W.__hexFilters = W.__hexFilters || { seats:{} };
    const seat = W.__hexFilters.seats[id] || (W.__hexFilters.seats[id] = { oneEuro:false, kalman:false });
    swOE.selected = !!seat.oneEuro; swKF.selected = !!seat.kalman;
    swOE.addEventListener('change', ()=>{ seat.oneEuro = !!swOE.selected; });
    swKF.addEventListener('change', ()=>{ seat.kalman = !!swKF.selected; });
  });
}

function createStub(title, testId){
  const root = document.createElement('div'); root.className='winbox wb-dark';
  const header=document.createElement('div'); header.className='wb-header'; const t=document.createElement('div'); t.className='wb-title'; t.textContent=title; header.appendChild(t);
  const body=document.createElement('div'); body.className='wb-body'; root.appendChild(header); root.appendChild(body);
  Object.assign(root.style,{position:'fixed',right:'12px',top:'12px',width:'540px',height:'420px',border:'1px solid rgba(255,255,255,0.12)',background:'#0f172a'});
  if(testId) root.setAttribute('data-testid',testId); document.body.appendChild(root);
  try{ window.__wbTest = window.__wbTest || {}; if(testId){ const k=testId.replace('winbox-',''); window.__wbTest[k]=true; } }catch{}
  return { dom: root, body, close:()=>{ try{root.remove();}catch{} } };
}
async function ensureMaterial(){ try{ const m=await import('../materialWeb.js'); await m.preloadMaterialDefaults(); await m.ensureMaterialComponent('md-switch'); return m.ensureMaterialComponent;}catch{return async()=>{}} }
