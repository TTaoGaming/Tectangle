// Shadow Auditor: enumerate threats and propose red-team probes
// Usage: node HiveFleetObsidian/tools/shadow_auditor_probes.mjs --target "flow"

function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const target = arg('target','critical flow');
const probes = [
  `Force error on ${target} at boundary (timeout/exception)` ,
  `Replay stale/forged inputs for ${target}` ,
  `Exceed rate/size limits for ${target}` ,
  `Disable guardrail and observe impact on ${target}` ,
  `Chaos: random fault injection around ${target}` ,
];
console.log(JSON.stringify({ target, probes }, null, 2));

