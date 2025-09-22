// Mock LLM adapter: returns deterministic, seat-shaped JSON for offline tests

export async function request({ messages, model='mock', temperature=0.1, maxTokens=512, seat='seat' }={}){
  // Extract a light topic from Board (Problem line) for deterministic variation by board state
  let topic = '';
  try{
    const userMsg = (messages||[]).filter(m=>m && m.role==='user').map(m=>m.content||'').join('\n');
    let m = userMsg.match(/^BoardProblem:\s*(.+)$/mi);
    if (!m) m = userMsg.match(/^Problem:\s*(.+)$/mi);
    if (m) {
      topic = String(m[1]||'').trim().split(/\s+/).slice(0,3).join(' ');
    }
  }catch{}
  const whatMap = {
    explore: 'Design 1–3 micro-tests and replay a short trace',
    pivot:   'Try a small method swap framed by constraints',
    reorient:'Adopt ports/adapters; land the smallest first step',
    exploit: 'One reversible step after green frozen checks',
  };
  const whyMap = {
    explore: 'Reduce uncertainty fast with cheap probes',
    pivot:   'Keep the aim; change the path to higher EV',
    reorient:'Reduce drift and enable parallel adapters',
    exploit: 'Move the metric today with minimal risk',
  };
  const winMap = {
    explore: 'Stop on signal or timeout',
    pivot:   'EV_new > EV_old; no regressions',
    reorient:'Pattern named; first step merged',
    exploit: 'dup==0 && smoke:pass && frozen:pass && miss==0',
  };
  const howMap = {
    explore: ['Name assumption in Board','Record 60s trace','Run replay and log result'],
    pivot:   ['Define metric and budget','Run prism_reframe.mjs','Keep winner; archive other'],
    reorient:['Name ports','Stub one adapter','Map links in web_map.md'],
    exploit: ['npm run hive:daily','Fix any MISS/dup','Append Scribe line'],
  };
  const seatKey = String(seat||'seat').toLowerCase();
  const payload = {
    what: (whatMap[seatKey] || 'One small, safe action') + (topic ? ` | focus: ${topic}` : ''),
    why: whyMap[seatKey] || 'Keep it simple and reversible',
    win: winMap[seatKey] || 'Green checks; no regressions',
    warnings: seatKey==='exploit' ? 'Ship only if frozen PASS' : 'Keep experiments cheap; archive findings',
    how: howMap[seatKey] || ['Name it','Do it small','Record it'],
    guardrail: 'Ship only if frozen stays green.',
    provenance: ['HiveFleetObsidian/tools/README.md'].concat(topic ? [`board:problem:${topic}`] : [])
  };
  return { text: JSON.stringify(payload), json: payload, usage: { tokens: 64 }, raw: { provider:'mock', seat: seatKey } };
}
