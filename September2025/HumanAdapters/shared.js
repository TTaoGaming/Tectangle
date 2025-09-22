export const MODELS = "/human-main-referenceonly/human-main/models";
export const DEMO_URL = "/human-main-referenceonly/human-main/demo/index.html?backend=webgl&worker=false&results=false";
export const HUMAN_ESM = "/human-main-referenceonly/human-main/dist/human.esm.js";

export const VIDEO_CHOICES = [
  { label: "Webcam", value: "webcam" },
  { label: "Pinch Forward (MP4)", value: "/right hand hand oriented towards the camera and wrist to middle knuckle pointing up index to thumb pinch.mp4" },
  { label: "Palm Left (Gated) (MP4)", value: "/right hand palm oriented to my left index and thumb pinch should be GATED.mp4" },
];

export function makeToolbar(doc){
  const bar = doc.createElement('div');
  bar.className = 'toolbar';
  bar.innerHTML = `
    <label>Input:
      <select id="inputSel"></select>
    </label>
    <input id="filePick" type="file" accept="video/*" />
    <button id="startBtn">Start</button>
    <span id="status" style="margin-left:auto;opacity:.8"></span>
  `;
  const sel = bar.querySelector('#inputSel');
  for(const v of VIDEO_CHOICES){
    const o = doc.createElement('option');
    o.value = v.value; o.textContent = v.label; sel.appendChild(o);
  }
  return bar;
}

export async function getMediaOrVideo(doc, choice){
  const video = doc.createElement('video');
  video.playsInline = true; video.muted = true; video.autoplay = false; video.controls = false;
  if(choice === 'webcam'){
    const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:false});
    video.srcObject = stream; await video.play();
  } else if(choice.startsWith('/')) {
    video.src = choice; video.loop = true; await video.play();
  } else {
    // fallback if file input selected
  }
  await new Promise(r=> video.onloadeddata = r);
  return video;
}

export function ensureOverlay(doc){
  const wrap = doc.createElement('div'); wrap.className='stack';
  const video = doc.createElement('video'); video.playsInline = true; video.muted=true; video.autoplay=false; video.controls=false;
  const canvas = doc.createElement('canvas');
  wrap.appendChild(video); wrap.appendChild(canvas);
  return {wrap, video, canvas};
}

export function fitCanvasToVideo(canvas, video){
  const dpr = devicePixelRatio || 1;
  const w = video.videoWidth|0, h = video.videoHeight|0;
  if(!w||!h) return;
  if(canvas.width!==w*dpr||canvas.height!==h*dpr){
    canvas.width = w*dpr; canvas.height = h*dpr;
  }
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
}

export function drawTips(ctx, hands, canvas){
  const dpr = devicePixelRatio || 1;
  ctx.save(); ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.lineWidth = 2; ctx.strokeStyle = '#2dd4bf';
  for(const h of hands){
    const k = h.landmarks || h.keypoints || h.keypoints3D || [];
    if(!k[8] || !k[4]) continue;
    const i = k[8], t = k[4];
    const w = canvas.width/dpr, hgt = canvas.height/dpr;
    const cx = (p)=> (p.x<=1? p.x*w : p.x);
    const cy = (p)=> (p.y<=1? p.y*hgt: p.y);
    ctx.fillStyle = '#a7f3d0'; ctx.beginPath(); ctx.arc(cx(i), cy(i), 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#67e8f9'; ctx.beginPath(); ctx.arc(cx(t), cy(t), 6, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
