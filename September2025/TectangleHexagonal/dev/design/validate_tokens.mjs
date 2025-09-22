#!/usr/bin/env node
/**
WEBWAY:ww-2025-049: Design tokens validator for M3
Validates m3.tokens.json schema and ensures CSS vars exist.
*/
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import Ajv from 'ajv';

const root = path.resolve(process.cwd(), 'September2025/TectangleHexagonal/dev/design');
const jsonPath = path.join(root, 'm3.tokens.json');
const cssPath = path.join(root, 'm3.tokens.css');

const schema = {
  type: 'object',
  required: ['version','color','shape','elevation','typography'],
  properties: {
    version: { type: 'integer' },
    color: { type: 'object', required: ['bg','surface','onSurface','primary','outline','card'], properties: {
      bg: { type: 'string' }, surface: { type: 'string' }, onSurface: { type: 'string' }, primary: { type: 'string' }, outline: { type: 'string' }, card: { type: 'string' }
    }},
    shape: { type: 'object', properties: { radius: { type: 'object' } } },
    elevation: { type: 'object' },
    typography: { type: 'object' },
  }
};

function toKebab(s){ return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(); }
function cssVarName(k){ return `--m3-${toKebab(k)}`; }

async function main(){
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const raw = await fs.readFile(jsonPath,'utf8');
  const tok = JSON.parse(raw);
  if(!validate(tok)){
    console.error('Token schema invalid:', validate.errors);
    process.exit(1);
  }
  const css = await fs.readFile(cssPath,'utf8');
  const requiredVars = ['bg','surface','onSurface','primary','outline','card','radius-xs','radius-sm','radius-md','radius-lg'].map(cssVarName);
  const missing = requiredVars.filter(v=> !css.includes(v));
  if(missing.length){
    console.error('Missing CSS variables:', missing);
    process.exit(2);
  }
  console.log('Design tokens OK');
}

main().catch(e=>{ console.error(e); process.exit(3); });
