// Settings Panel — raw global toggles and defaults
export async function openSettingsPanel(){
  let wb;
  try { const { createWinBoxWindow } = await import('../winBoxHost.js'); wb = await createWinBoxWindow({ title:'Settings (Global)', width:480, height:360 }); wb?.dom?.setAttribute?.('data-testid','winbox-settings'); }
  catch { wb = createStub('Settings (Global)', 'winbox-settings'); }
  const root = document.createElement('div');
  root.style.cssText='padding:10px;font:13px system-ui,Segoe UI,Roboto,Arial;color:#e5e7eb;';
  const ensure = await ensureMaterial();
  root.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><strong>Global Flags</strong></div>
    <div style="display:grid;grid-template-columns:1fr;gap:10px">
      <div><md-switch id="t1" icons></md-switch> <label for="t1">Tracker T1 (FEATURE_HEX_HAND_TRACKER_T1)</label></div>
      <div><md-switch id="t1req" icons></md-switch> <label for="t1req">Require T1 (FEATURE_T1_TRACKER_REQUIRED)</label></div>
      <div><md-switch id="guard" icons></md-switch> <label for="guard">HandId Guard (FEATURE_TELEM_HANDID_GUARD)</label></div>
    </div>
  `;
  wb.body.appendChild(root);
  const W=window; const $=(sel)=>root.querySelector(sel);
  const swT1=$('#t1'), swReq=$('#t1req'), swG=$('#guard');
  swT1.selected=!!W.FEATURE_HEX_HAND_TRACKER_T1; swReq.selected=!!W.FEATURE_T1_TRACKER_REQUIRED; swG.selected=(W.FEATURE_TELEM_HANDID_GUARD??true)?true:false;
  swT1.addEventListener('change',()=>{ W.FEATURE_HEX_HAND_TRACKER_T1=!!swT1.selected; });
  swReq.addEventListener('change',()=>{ W.FEATURE_T1_TRACKER_REQUIRED=!!swReq.selected; });
  swG.addEventListener('change',()=>{ W.FEATURE_TELEM_HANDID_GUARD=!!swG.selected; });
}

function createStub(title, testId){
  const root = document.createElement('div'); root.className='winbox wb-dark';
  const header=document.createElement('div'); header.className='wb-header'; const t=document.createElement('div'); t.className='wb-title'; t.textContent=title; header.appendChild(t);
  const body=document.createElement('div'); body.className='wb-body'; root.appendChild(header); root.appendChild(body);
  Object.assign(root.style,{position:'fixed',right:'12px',top:'12px',width:'480px',height:'360px',border:'1px solid rgba(255,255,255,0.12)',background:'#0f172a'});
  if(testId) root.setAttribute('data-testid',testId); document.body.appendChild(root);
  try{ window.__wbTest = window.__wbTest || {}; if(testId){ const k=testId.replace('winbox-',''); window.__wbTest[k]=true; } }catch{}
  return { dom: root, body, close:()=>{ try{root.remove();}catch{} } };
}
async function ensureMaterial(){ try{ const m=await import('../materialWeb.js'); await m.preloadMaterialDefaults(); await m.ensureMaterialComponent('md-switch'); return m.ensureMaterialComponent;}catch{return async()=>{}} }
