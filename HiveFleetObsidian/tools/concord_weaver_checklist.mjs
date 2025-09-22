// Concord Weaver: emit a minimal adoption checklist
// Usage: node HiveFleetObsidian/tools/concord_weaver_checklist.mjs --name "Artifact"

function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const name = arg('name','Artifact');

const checklist = [
  `README: 90-second overview for ${name}`,
  'Entry points: one-liners to run locally',
  'Defaults: safe config committed',
  'First-run task: verifies fit and prints next steps',
  'Handoff: short section with support/limits',
];
console.log(JSON.stringify({ adoption_checklist: { name, items: checklist } }, null, 2));

