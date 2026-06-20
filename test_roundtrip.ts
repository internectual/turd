import { Compiler } from './src/compiler/index';
import { FileLoader, decompile } from './src/decompiler';

// Test 1: Simple function
const code1 = 'function test() { return 1; }';
const c1 = new Compiler('TGE10');
const b1 = c1.compile(code1);
const r1 = decompile(new Uint8Array(b1));
console.log('Test 1:', r1.ok ? 'PASS' : 'FAIL: ' + r1.error);
if (r1.ok) console.log(r1.source);

// Test 2: Function with if/else
const code2 = 'function check(%x) { if (%x > 10) { return "big"; } else { return "small"; } }';
const c2 = new Compiler('TGE10');
const b2 = c2.compile(code2);
const r2 = decompile(new Uint8Array(b2));
console.log('Test 2:', r2.ok ? 'PASS' : 'FAIL: ' + r2.error);
if (r2.ok) console.log(r2.source);

// Test 3: Function with while loop
const code3 = 'function count(%n) { %i = 0; while (%i < %n) { %i = %i + 1; } return %i; }';
const c3 = new Compiler('TGE10');
const b3 = c3.compile(code3);
const r3 = decompile(new Uint8Array(b3));
console.log('Test 3:', r3.ok ? 'PASS' : 'FAIL: ' + r3.error);
if (r3.ok) console.log(r3.source);
