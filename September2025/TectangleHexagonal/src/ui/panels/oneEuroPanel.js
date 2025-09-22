// WEBWAY:ww-2025-109: Hex Panel — One Euro Filter (stub)
export async function openOneEuroPanel(){
  const { createWinBoxWindow } = await import('../winBoxHost.js');
  const wb = await createWinBoxWindow({ title: 'One Euro Filter', width: 420, height: 320 });
  wb?.dom?.classList?.add('wb-dark');
  const root = document.createElement('div');
  root.style.padding = '8px';
  root.innerHTML = `<div>
    <strong>One Euro</strong>
    <div style="opacity:0.85;font-size:12px;margin-top:4px">Cutoff/beta controls and live charts landing here.</div>
  </div>`;
  wb?.body?.appendChild(root);
}
