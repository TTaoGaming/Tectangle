// canvasOverlayRenderer: Adapter that renders normalized ops onto a canvas with fit + mirror.
// API: createCanvasOverlayRenderer({ canvas, video, fit:'cover'|'contain', mirror:boolean })
//   -> { render(sample) }

export function createCanvasOverlayRenderer({ canvas, video, fit='cover', mirror=true }={}){
  if(!canvas) throw new Error('canvasOverlayRenderer requires canvas');
  const ctx = canvas.getContext('2d');

  function resize(){
    const parent = video?.parentElement || canvas.parentElement || document.body;
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;
    if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
  }

  // Compute transform once per frame (avoid per-point recompute cost beyond cheap ops)
  function computeTransform(){
    const vw = video?.videoWidth || 640; const vh = video?.videoHeight || 480;
    const CW = canvas.width; const CH = canvas.height;
    const scale = (fit==='cover') ? Math.max(CW/vw, CH/vh) : Math.min(CW/vw, CH/vh);
    const drawW = vw * scale; const drawH = vh * scale;
    const offX = (CW - drawW)/2; const offY = (CH - drawH)/2;
    return { vw, vh, scale, offX, offY, drawW, drawH };
  }

  function project(coordSpace, xVal, yVal, tf){
    // WEBWAY:ww-2025-009 if coordinateSpace==='normalized', xVal,yVal in 0..1 -> multiply by vw/vh
    const xPix = coordSpace==='normalized' ? (xVal * tf.vw) : xVal;
    const yPix = coordSpace==='normalized' ? (yVal * tf.vh) : yVal;
    let x = tf.offX + xPix * tf.scale;
    let y = tf.offY + yPix * tf.scale;
    if(mirror){
      const rel = x - tf.offX; x = tf.offX + (tf.drawW - rel);
    }
    return { x, y };
  }

  function render(sample){
    if(!sample) return; resize(); ctx.clearRect(0,0,canvas.width,canvas.height);
    const { ops, coordinateSpace } = sample;
    const tf = computeTransform();
    const debug = !!(globalThis.__flags && globalThis.__flags.FEATURE_OVERLAY_DEBUG);
    if(debug){
      // WEBWAY:ww-2025-010 debug drawing: bold fit rect + transform numbers
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ff0077';
      ctx.setLineDash([8,4]);
      ctx.strokeRect(tf.offX, tf.offY, tf.drawW, tf.drawH);
      ctx.font = '12px ui-monospace,monospace';
      ctx.fillStyle = '#ff0077';
      const lines = [
        `fit=${fit} mirror=${mirror?'1':'0'}`,
        `vw=${tf.vw} vh=${tf.vh}`,
        `scale=${tf.scale.toFixed(3)}`,
        `off=(${tf.offX.toFixed(1)},${tf.offY.toFixed(1)})`,
        `draw=(${tf.drawW.toFixed(1)}x${tf.drawH.toFixed(1)})`,
        `ops=${ops.length} space=${coordinateSpace}`
      ];
      let y=14; for(const ln of lines){ ctx.fillText(ln, tf.offX+6, tf.offY + y); y+=14; }
      ctx.restore();
    }
    for(const o of ops){
      if(o.kind==='dot'){
        const p = project(coordinateSpace, o.x, o.y, tf);
        ctx.beginPath(); ctx.fillStyle = o.color || '#fff'; ctx.arc(p.x, p.y, o.r||2, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  return { render };
}

export default { createCanvasOverlayRenderer };
