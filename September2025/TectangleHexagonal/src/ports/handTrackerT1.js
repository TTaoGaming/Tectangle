/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Verify dependent modules and update factorization notes
 - [ ] Log decisions in TODO_2025-09-16.md
*/


// WEBWAY:ww-2025-001: Tier-1 Hand Tracker (NN + inertia + side prior)
// Purpose: Stabilize per-hand identity and handedness labels with tiny CPU cost.
// Notes: No DOM. Pure logic; safe for mid-range smartphones.

const DEFAULT_SEATS = ['P1','P2','P3','P4'];

export function createHandTrackerT1(opts={}){
  const cfg = Object.assign({
    maxJump: 0.18,
    teleport: 0.42,
    memoryMs: 200,
    labelConfirmMs: 150,
    maxTracks: 2,
    seats: DEFAULT_SEATS,
  }, opts);

  cfg.seats = Array.isArray(cfg.seats) && cfg.seats.length ? [...cfg.seats] : [...DEFAULT_SEATS];

  /** @type {Array<{ id:string, lastPos:[number,number,number], lastSeen:number, vx:number, vy:number, label:string, seat:string|null, pendingLabel?:{val:string,since:number}, continuity:number, createdAt:number, lastTeleportAt:number|null, boneHash:string|null, lifeFrames:number }>} */
  const tracks = [];

  const seatToTrack = new Map(); // seat -> handId

  const stats = { frames:0, teleports:0, reassigns:0, alive:0 };

  let idCounter = 1;

  function computeBoneHash(lm){
    if(!lm || lm.length < 21) return null;
    function dist(a,b){ const dx=lm[a][0]-lm[b][0], dy=lm[a][1]-lm[b][1], dz=(lm[a][2]-lm[b][2])||0; return Math.hypot(dx,dy,dz); }
    const palmSpan = dist(5,17) + dist(0,9);
    if(palmSpan === 0) return null;
    const segs = [
      dist(1,2),dist(2,3),dist(3,4),
      dist(5,6),dist(6,7),dist(7,8),
      dist(9,10),dist(10,11),dist(11,12),
      dist(13,14),dist(14,15),dist(15,16),
      dist(17,18),dist(18,19),dist(19,20)
    ].map(v=> Math.min(35, Math.max(0, Math.round((v/palmSpan)*35))).toString(36));
    return segs.join('');
  }

  function nextHandId(){
    return `H${idCounter++}`;
  }

  function preferredSeatsForLabel(label){
    const seats = [];
    if(label === 'Left' && cfg.seats.length > 1){
      seats.push(cfg.seats[1]);
    }
    if(cfg.seats.length){
      seats.push(cfg.seats[0]);
    }
    return seats;
  }

  function rememberSeat(track, seat){
    if(!seat) return;
    const existing = seatToTrack.get(seat);
    if(existing && existing !== track.id){
      const other = tracks.find(tr => tr.id === existing);
      if(other){
        other.seat = null;
      }
    }
    track.seat = seat;
    seatToTrack.set(seat, track.id);
  }

  function releaseSeat(track){
    if(track.seat && seatToTrack.get(track.seat) === track.id){
      seatToTrack.delete(track.seat);
    }
    track.seat = null;
  }

  function allocateSeat(track, preferred){
    if(preferred && !seatToTrack.has(preferred)){
      rememberSeat(track, preferred);
      return track.seat;
    }
    for(const seat of preferredSeatsForLabel(track.label)){
      if(seat && !seatToTrack.has(seat)){
        rememberSeat(track, seat);
        return track.seat;
      }
    }
    for(const seat of cfg.seats){
      if(!seatToTrack.has(seat)){
        rememberSeat(track, seat);
        return track.seat;
      }
    }
    return track.seat;
  }

  function dist2(a,b){ const dx=a[0]-b[0], dy=a[1]-b[1]; return dx*dx+dy*dy; }

  function pruneExpired(t){
    for(let i=tracks.length-1;i>=0;i--){
      const tr = tracks[i];
      if(t - (tr.lastSeen||0) > cfg.memoryMs){
        releaseSeat(tr);
        tracks.splice(i,1);
      }
    }
  }

  function assign(dets, t){
    stats.frames++;
    pruneExpired(t);

    const preds = tracks.map(tr=> ({ tr, x: tr.lastPos[0] + (tr.vx||0)*0.03, y: tr.lastPos[1] + (tr.vy||0)*0.03 }));

    const usedTracks = new Set();
    const usedDetections = new Set();
    const out = new Array(dets.length).fill(null);

    const pairs = [];
    for(let i=0;i<dets.length;i++){
      const d = dets[i];
      for(let j=0;j<tracks.length;j++){
        const p = preds[j] || { tr: tracks[j], x:tracks[j].lastPos[0], y:tracks[j].lastPos[1] };
        pairs.push({ i, j, dd: dist2([d.wrist[0], d.wrist[1]], [p.x, p.y]) });
      }
    }
    pairs.sort((a,b)=> a.dd - b.dd);
    for(const {i,j,dd} of pairs){
      if(usedDetections.has(i) || usedTracks.has(j)) continue;
      const jump = Math.sqrt(dd);
      if(jump <= cfg.maxJump){ out[i] = tracks[j]; usedDetections.add(i); usedTracks.add(j); }
    }

    for(let i=0;i<dets.length;i++){
      if(out[i]) continue;
      if(tracks.length >= cfg.maxTracks) continue;
      const d = dets[i];
      const track = {
        id: nextHandId(),
        lastPos: d.wrist.slice(),
        lastSeen: t,
        vx: 0,
        vy: 0,
        label: d.rawLabel === 'Left' ? 'Left' : 'Right',
        seat: null,
        pendingLabel: undefined,
        continuity: 0,
        createdAt: t,
        lastTeleportAt: null,
        boneHash: null,
        lifeFrames: 0,
      };
      allocateSeat(track);
      tracks.push(track);
      out[i] = track;
    }

    for(let i=0;i<dets.length;i++){
      const tr = out[i];
      if(!tr) continue;
      const d = dets[i];
      const px = tr.lastPos[0], py = tr.lastPos[1];
      const nx = d.wrist[0], ny = d.wrist[1];
      const jump = Math.hypot(nx - px, ny - py);
      tr.vx = nx - px;
      tr.vy = ny - py;
      tr.lastPos = d.wrist.slice();
      tr.lastSeen = t;
      tr.lifeFrames++;
      if(!tr.boneHash && d.landmarks){ tr.boneHash = computeBoneHash(d.landmarks); }
      if(!tr.seat || seatToTrack.get(tr.seat) !== tr.id){
        allocateSeat(tr, tr.seat);
      }
      const rawLabel = d.rawLabel === 'Left' ? 'Left' : 'Right';
      if(jump >= cfg.teleport){
        tr.label = rawLabel;
        tr.pendingLabel = undefined;
        stats.teleports++;
        tr.lastTeleportAt = t;
        tr.continuity = Math.max(0, tr.continuity * 0.4);
        allocateSeat(tr, tr.seat);
      } else if(rawLabel !== tr.label){
        if(!tr.pendingLabel || tr.pendingLabel.val !== rawLabel){
          tr.pendingLabel = { val: rawLabel, since: t };
        } else if(t - tr.pendingLabel.since >= cfg.labelConfirmMs){
          tr.label = rawLabel;
          tr.pendingLabel = undefined;
          stats.reassigns++;
          tr.continuity = Math.max(0, tr.continuity * 0.7);
          allocateSeat(tr, tr.seat);
        }
      } else {
        tr.pendingLabel = undefined;
      }
      tr.continuity = Math.min(100, tr.continuity + 1);
    }

    stats.alive = tracks.length;

    return dets.map((d, idx)=>{
      const tr = out[idx];
      if(!tr){
        return { handId: null, hand: d.rawLabel === 'Left' ? 'Left' : 'Right', controllerId: null };
      }
      return {
        handId: tr.id,
        hand: tr.label,
        controllerId: tr.seat,
        boneHash: tr.boneHash || null,
      };
    });
  }

  function getStats(){
    return {
      frames: stats.frames,
      teleports: stats.teleports,
      reassigns: stats.reassigns,
      alive: stats.alive,
      tracks: tracks.map(tr=> ({
        id: tr.id,
        label: tr.label,
        seat: tr.seat,
        continuity: tr.continuity,
        createdAt: tr.createdAt,
        lifeFrames: tr.lifeFrames,
        boneHash: tr.boneHash,
        lastSeen: tr.lastSeen,
      })),
    };
  }

  function reset(){
    tracks.splice(0, tracks.length);
    seatToTrack.clear();
    stats.frames = 0;
    stats.teleports = 0;
    stats.reassigns = 0;
    stats.alive = 0;
    idCounter = 1;
  }

  return { assign, getStats, reset };
}
