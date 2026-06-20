import { Compiler } from './src/compiler/index';
import { decompile } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
console.log('Bytecode length:', b.length);
const r = decompile(new Uint8Array(b));
console.log('Decompile:', r.ok ? 'PASS' : 'FAIL: ' + r.error);
if (r.ok) console.log(r.source.substring(0, 1000));
