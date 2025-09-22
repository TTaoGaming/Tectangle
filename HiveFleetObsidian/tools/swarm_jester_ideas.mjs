// Swarm Jester: generate small divergent probes from a prompt
// Usage: node HiveFleetObsidian/tools/swarm_jester_ideas.mjs --prompt "..." [--n 5]

function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const prompt = arg('prompt','idea seed');
const n = Math.max(1, Number(arg('n','5')));

const templates = [
  (p)=>`Flip representation of ${p} (e.g., polar vs cartesian)`,
  (p)=>`Shrink scope of ${p} to a 60s timebox experiment`,
  (p)=>`Swap signal of ${p} for a proxy metric and compare`,
  (p)=>`Introduce a clamp or bias to ${p} and test effect`,
  (p)=>`Randomized sub-sample on ${p} to estimate variance`,
  (p)=>`Record one golden trace around ${p} and replay`,
];

const out = [];
for(let i=0;i<n;i++) out.push(templates[i%templates.length](prompt));
console.log(JSON.stringify({ prompt, ideas: out }, null, 2));

