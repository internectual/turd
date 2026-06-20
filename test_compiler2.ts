// test_compiler2.ts — Verify opcode output differs per target

import { Compiler } from './src/compiler/index';

const test = `
function testFunc(%a, %b)
{
  %c = %a + %b;
  return %c;
}
`;

const targets = ['TGE10', 'Tribes2', 'TGE14', 'Constructor', 'TFD', 'BlocklandV1', 'BlocklandV20', 'BlocklandV21'];

for (const target of targets) {
  const compiler = new Compiler(target);
  const result = compiler.compile(test);
  // Show first 20 bytes as hex
  const hex = Array.from(result.slice(0, 30)).map(b => b.toString(16).padStart(2, '0')).join(' ');
  console.log(`${target.padEnd(15)}: ${hex}`);
}

// Test round-trip: compile then decompile
console.log('\n--- Round-trip test ---');
import { FileLoader } from './src/file-loader';
import { Decompiler } from './src/decompiler';

const compiler = new Compiler('TGE10');
const bytecode = compiler.compile(test);
console.log(`Compiled ${bytecode.length} bytes`);

// Try to load and decompile
try {
  const loader = new FileLoader();
  // Write to temp file and load back
  const fs = require('fs');
  fs.writeFileSync('/tmp/test_output.cs.dso', bytecode);
  const data = loader.load('/tmp/test_output.cs.dso');
  if (data) {
    const decompiler = new Decompiler(data, 'TGE10');
    const output = decompiler.decompile();
    console.log('Decompiled output:');
    console.log(output);
  } else {
    console.log('Failed to load compiled file');
  }
} catch (e: any) {
  console.log(`Round-trip error: ${e.message}`);
}
