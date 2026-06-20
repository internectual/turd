// test_switch_compile.ts — Test switch compilation

import { Compiler } from './src/compiler/index';
import { decompile } from './src/decompiler';
import * as fs from 'fs';

const code = `
function describe(%x)
{
  switch (%x)
  {
    case 1:
      return "one";
    case 2:
      return "two";
    default:
      return "other";
  }
}
`;

const compiler = new Compiler('TGE10');
const bytecode = compiler.compile(code);
console.log(`Compiled to ${bytecode.length} bytes`);

// Show hex
const hex = Array.from(bytecode).map(b => b.toString(16).padStart(2, '0')).join(' ');
console.log(hex);

fs.writeFileSync('/tmp/test_switch.cs.dso', bytecode);
const fb = fs.readFileSync('/tmp/test_switch.cs.dso');
const ab = fb.buffer.slice(fb.byteOffset, fb.byteOffset + fb.byteLength);
const result = decompile(ab, 'TGE10');
console.log(`Success: ${result.success}`);
if (result.success) {
  console.log(result.output);
} else {
  console.log(`Error: ${result.error}`);
}
