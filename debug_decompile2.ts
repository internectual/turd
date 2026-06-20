import { Compiler } from './src/compiler/index';
import { decompile } from './src/decompiler';

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');
const result = decompile(b);
console.log('Result:', result.ok ? 'PASS' : 'FAIL: ' + result.error);
if (result.ok) console.log('Source:', result.source);
