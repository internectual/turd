import { Compiler } from './src/compiler/index';
import { decompile } from './src/decompiler';

const c = new Compiler('TGE10');
const compiled = c.compile('function test() { return 1; }');
const result = decompile(compiled);
console.log('Simple test:', result.ok, result.source?.substring(0, 100));

// Now try with Tribes2 version
const c2 = new Compiler('Tribes2');
const compiled2 = c2.compile('function test() { return 1; }');
const result2 = decompile(compiled2);
console.log('Tribes2 test:', result2.ok, result2.source?.substring(0, 100));
