 // Voice Renderer: generate conversational champion lines with mild variety
// Export: render(seat, payload, { tone:'casual'|'formal', variety:0|1|2, seed:string })

// Simple seeded PRNG (xmur3 + mulberry32)
function xmur3(str){ let h=1779033703^str.length; for(let i=0;i<str.length;i++){ h = Math.imul(h^str.charCodeAt(i),3432918353); h = (h<<13)|(h>>>19);} return function(){ h = Math.imul(h^ (h>>>16),2246822507); h = Math.imul(h^ (h>>>13),3266489909); return (h^ (h>>>16))>>>0; } }
function mulberry32(a){ return function(){ let t = a += 0x6D2B79F5; t = Math.imul(t ^ (t>>>15), t | 1); t ^= t + Math.imul(t ^ (t>>>7), t | 61); return ((t ^ (t>>>14))>>>0)/4294967296; } }
function pick(arr, rnd){ return arr[Math.floor(rnd()*arr.length)]; }

const TEMPLATES = {
  exploit: [
    'Decide. {action} {guard} {tag}',
    'Let’s move: {action} {guard} {tag}',
    'Small, safe cut: {action} {guard} {tag}',
  ],
  explore: [
    'I’ll run a quick probe: {action}. If not {win}, we stop and adjust.',
    'Fast test: {action}. Stop when {win}.',
    'Signal check: {action}. We call it if {win}.',
  ],
  pivot: [
    'Same aim, new path: {what}. Good when {win}.',
    'Keep the goal; change the route: {what}. Win: {win}.',
    'Mirror-mask says try: {what}. We keep it if {win}.',
  ],
  reorient: [
    'Map says: {what} — smallest step first. {hint}',
    'Show the map: {what}. Take the tiniest path. {hint}',
    'Seam named: {what}. We step light. {hint}',
  ]
};

export function render(seat, payload, opts={}){
  const { tone='casual', variety=1, seed='hfo' } = opts;
  const seedFn = mulberry32(xmur3(`${seed}:${seat}:${tone}:${variety}`)());
  const base = TEMPLATES[seat] || ['{what}'];
  // variety selects more random picks; 0 -> first template
  const tmpl = variety===0 ? base[0] : pick(base, seedFn);

  function subst(s){
    return s
      .replace('{action}', payload.action||payload.what||'')
      .replace('{what}', payload.what||payload.action||'')
      .replace('{win}', payload.win||'it meets the check')
      .replace('{guard}', payload.guard||'')
      .replace('{tag}', payload.tag||'')
      .replace('{hint}', payload.hint ? `(${payload.hint})` : '');
  }

  let line = subst(tmpl).replace(/\s+/g,' ').trim();
  if (tone==='formal') line = line.replace(/^Let’s move:/,'Proceed:');
  return line;
}

