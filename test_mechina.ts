// test_mechina.ts — Test compiling TorqueScript and comparing with Mechina DSO files

import { Compiler } from './src/compiler/index';
import { decompile } from './src/decompiler';
import * as fs from 'fs';
import * as path from 'path';

// Read a sample Mechina DSO file and decompile it
const mechinaDir = '/home/methodown/Downloads/mechina/herc_scripts/';
const files = fs.readdirSync(mechinaDir).filter(f => f.endsWith('.dso'));

console.log(`Found ${files.length} DSO files in Mechina`);

// Test decompiling a few files
let passed = 0, failed = 0;
for (const file of files.slice(0, 5)) {
  try {
    const fb = fs.readFileSync(path.join(mechinaDir, file));
    const ab = fb.buffer.slice(fb.byteOffset, fb.byteOffset + fb.byteLength);
    const result = decompile(ab, 'Tribes2');
    if (result.success) {
      console.log(`OK: ${file} (${fb.length} bytes)`);
      passed++;

      // Try to re-compile the decompiled output and compare
      // This is a full round-trip test
      const decompiledCode = result.output;
      if (decompiledCode.trim().length > 0 && decompiledCode.includes('function')) {
        try {
          const compiler = new Compiler('Tribes2');
          const recompiled = compiler.compile(decompiledCode);
          const fb2 = Buffer.from(recompiled);
          // Just verify it compiles without error
          console.log(`  Re-compiled: ${fb2.length} bytes (original: ${fb.length} bytes)`);
        } catch (e: any) {
          console.log(`  Re-compile failed: ${e.message.split('\n')[0]}`);
        }
      }
    } else {
      console.log(`FAIL: ${file} - ${result.error}`);
      failed++;
    }
  } catch (e: any) {
    console.log(`ERROR: ${file} - ${e.message.split('\n')[0]}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
