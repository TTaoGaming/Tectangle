// Prism Reframe: keep the goal, change the angle (perspective-first pivot)
// Usage: node HiveFleetObsidian/tools/prism_reframe.mjs --goal "..." --baseline "desc" --alt "desc" [--budget-min 20]

function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const goal = arg('goal','');
const baseline = arg('baseline','baseline');
const alt = arg('alt','alternative');
const budget = Number(arg('budget-min','20'));

if(!goal){
  console.log('[Prism] Provide --goal "..." to describe the same goal.');
  process.exit(0);
}

const plan = {
  goal,
  compare: { baseline, alt, method: 'EV (Impact*Confidence)/(Cost*Risk)' },
  constraints: { budget_min: budget },
  steps: [
    'Define win metric and constraint(s)',
    'Instrument lightweight counters/timers if missing',
    'Run baseline short sample; record EV_old',
    'Run alternative under a flag; record EV_new',
    'Keep winner; archive the other path'
  ],
};
console.log(JSON.stringify({ prism_plan: plan }, null, 2));

