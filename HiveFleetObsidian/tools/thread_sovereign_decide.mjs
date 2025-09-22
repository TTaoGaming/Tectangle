// CLI: run Thread Sovereign decideExploit using fs_env adapter
import { readBoard, readHealth, readDoctrine } from '../honeycomb/champions/ThreadSovereign/adapters/fs_env.mjs';
import { decideExploit } from '../honeycomb/champions/ThreadSovereign/core/decide_exploit.mjs';

const input = { board: readBoard(), health: readHealth(), doctrine: readDoctrine() };
const out = decideExploit(input);
console.log(JSON.stringify(out, null, 2));

