import { Compiler } from './src/compiler/index';
import { FileLoader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

console.log('codeSize:', data.code.length);
console.log('First 20 opcodes:', Array.from(data.code.slice(0, 20)));
console.log('Last 20 opcodes:', Array.from(data.code.slice(-20)));

// Check identifier table
console.log('\nIdentifier table size:', data.identifierTable.size);
let invalidCount = 0;
for (let i = 0; i < data.code.length; i++) {
  const val = data.code[i];
  if (val > 83 && !data.identifierTable.has(i)) {
    invalidCount++;
    if (invalidCount <= 10) {
      console.log('Invalid opcode at ip=' + i + ' val=' + val);
    }
  }
}
console.log('Total invalid opcodes (not in identTable):', invalidCount);
