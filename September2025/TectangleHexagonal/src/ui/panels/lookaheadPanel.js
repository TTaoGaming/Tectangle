// WEBWAY:ww-2025-109: Hex Panel — Predictive Lookahead (stub)
export async function openLookaheadPanel(){
  const { createWinBoxWindow } = await import('../winBoxHost.js');
  const wb = await createWinBoxWindow({ title: 'Predictive Lookahead', width: 480, height: 340 });
  wb?.dom?.classList?.add('wb-dark');
  const root = document.createElement('div');
  root.style.padding = '8px';
  root.innerHTML = `<div>
    <strong>Lookahead</strong>
    <div style="opacity:0.85;font-size:12px;margin-top:4px">TOI/Kalman projections and velocity bands will visualize here.</div>
  </div>`;
  wb?.body?.appendChild(root);
}
