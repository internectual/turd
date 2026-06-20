import { Compiler } from './src/compiler/index';
import { decompile } from './src/decompiler';

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');
const result = decompile(b);
console.log('Result:', JSON.stringify(result, null, 2));
