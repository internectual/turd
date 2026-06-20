import { Compiler } from './src/compiler/index';
import { decompile } from './src/decompiler';

const code = 'function test() { return 1; }';
const c = new Compiler('TGE10');
const b = c.compile(code);
console.log('Bytecode length:', b.length);
const r = decompile(new Uint8Array(b));
console.log('Decompile:', r.ok ? 'PASS' : 'FAIL: ' + r.error);
if (r.ok) console.log(r.source);
