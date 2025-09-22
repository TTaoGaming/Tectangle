// CLI: Prism Magus planPivot in plain language
import { planPivot } from '../honeycomb/champions/PrismMagus/core/plan_pivot.mjs';

const intent = process.argv.slice(2).join(' ') || '';
const out = planPivot({ intent });
console.log(JSON.stringify(out, null, 2));

