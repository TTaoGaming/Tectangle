const fs = require('fs');
const vm = require('vm');
const path = 'August Tectangle Sprint/foundation/ui/bottomDrawer.js';
try {
  const code = fs.readFileSync(path, 'utf8');
  new vm.Script(code, { filename: path });
  console.log('JS_SYNTAX_OK');
} catch (e) {
  console.error('JS_SYNTAX_ERROR', e && e.message ? e.message : e);
  process.exit(2);
}