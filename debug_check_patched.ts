import { Compiler } from './src/compiler/index';
import { FileLoader, Opcode, Ops } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);

const loader = new FileLoader();
const data = loader.load(b);

// Find all invalid opcodes and check if they're in the identifier table
let invalidCount = 0;
let patched = 0;
let unpatched = 0;
let unpatchedPositions: number[] = [];

for (let i = 0; i < data.code.length; i++) {
  const val = data.code[i];
  if (val > 83) {
    invalidCount++;
    if (data.identifierTable.has(i)) {
      patched++;
    } else {
      unpatched++;
      if (unpatchedPositions.length < 20) {
        unpatchedPositions.push(i);
      }
    }
  }
}

console.log('Total invalid opcodes:', invalidCount);
console.log('Patched by identifier table:', patched);
console.log('Unpatched:', unpatched);
console.log('Unpatched positions:', unpatchedPositions);
