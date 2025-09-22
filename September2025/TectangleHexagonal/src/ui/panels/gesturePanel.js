// WEBWAY:ww-2025-109: Hex Panel — Gesture Recognizer (stub)
export async function openGesturePanel(){
  const { createWinBoxWindow } = await import('../winBoxHost.js');
  const wb = await createWinBoxWindow({ title: 'Gesture Recognizer', width: 420, height: 320 });
  wb?.dom?.classList?.add('wb-dark');
  const root = document.createElement('div');
  root.style.padding = '8px';
  root.innerHTML = `<div>
    <strong>Recognizer</strong>
    <div style="opacity:0.85;font-size:12px;margin-top:4px">Stream of top labels/scores per seat will appear here.</div>
  </div>`;
  wb?.body?.appendChild(root);
}
