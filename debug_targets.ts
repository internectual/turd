import { Compiler } from './src/compiler/index';
import { FileLoader, decompile } from './src/decompiler';
import * as fs from 'fs';

// Use a simpler test that we know works
const code1 = 'function test() { return 1; }';
const c1 = new Compiler('TGE10');
const b1 = c1.compile(code1);
const r1 = decompile(new Uint8Array(b1));
console.log('Simple test:', r1.ok ? 'PASS' : 'FAIL: ' + r1.error);

// Try with Tribes2 target
const c2 = new Compiler('Tribes2');
const b2 = c2.compile(code1);
const r2 = decompile(new Uint8Array(b2));
console.log('Tribes2 simple:', r2.ok ? 'PASS' : 'FAIL: ' + r2.error);

// Try with TFD target
const c3 = new Compiler('TFD');
const b3 = c3.compile(code1);
const r3 = decompile(new Uint8Array(b3));
console.log('TFD simple:', r3.ok ? 'PASS' : 'FAIL: ' + r3.error);

// Now try console_start.cs with each target
const code2 = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');

for (const target of ['TGE10', 'Tribes2', 'TFD']) {
  try {
    const c = new Compiler(target);
    const b = c.compile(code2);
    const r = decompile(new Uint8Array(b));
    console.log(target + ' console_start:', r.ok ? 'PASS' : 'FAIL: ' + r.error);
  } catch (e: any) {
    console.log(target + ' console_start: COMPILE ERROR: ' + e.message.substring(0, 80));
  }
}
