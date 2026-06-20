import { FileLoader } from './src/decompiler';
import * as fs from 'fs';

// Read a real DSO file
const realDso = fs.readFileSync('/home/methodown/Downloads/mechina/herc_scripts/console_end.cs.dso');
const realData = new FileLoader().load(new Uint8Array(realDso));

console.log('Real DSO:');
console.log('  codeSize from header: unknown (need to parse)');
console.log('  data.code.length:', realData.code.length);
console.log('  First 10 opcodes:', Array.from(realData.code.slice(0, 10)));

// Now our DSO
import { Compiler } from './src/compiler/index';
const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const ourData = new FileLoader().load(new Uint8Array(b));

console.log('\nOur DSO:');
console.log('  data.code.length:', ourData.code.length);
console.log('  First 10 opcodes:', Array.from(ourData.code.slice(0, 10)));

// The real DSO works with the decompiler, so data.code.length should equal the codeSize in the header
// Let's check if our DSO has the same issue
console.log('\nChecking code stream validity:');
let invalidCount = 0;
for (let i = 0; i < ourData.code.length; i++) {
  const val = ourData.code[i];
  if (val < 0 || val > 83) {
    invalidCount++;
    if (invalidCount <= 5) {
      console.log('  Invalid opcode at', i + ':', val);
    }
  }
}
console.log('  Total invalid opcodes:', invalidCount);
