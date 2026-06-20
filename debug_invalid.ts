import { Compiler } from './src/compiler/index';
import { FileLoader, Opcode, OpcodeTag, Ops } from './src/decompiler';
import * as fs from 'fs';

const ops = new Ops();
const T = OpcodeTag;

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

// Find the first position where the decompiler would fail
// by checking if any opcode value at an even moderately aligned position is invalid

// First, let's find ALL positions with invalid opcodes
console.log('Finding all invalid opcode positions...');
const invalidPositions = [];
for (let i = 0; i < Math.min(data.code.length, 500); i++) {
  const val = data.code[i];
  if (!Opcode.create(val, ops)) {
    invalidPositions.push(i);
  }
}

console.log('Invalid positions (first 500):', invalidPositions.slice(0, 20));
console.log('Total invalid in first 500:', invalidPositions.length);

// Check if invalid positions are always preceded by a specific opcode
console.log('\nOpcodes before invalid positions:');
for (const pos of invalidPositions.slice(0, 20)) {
  if (pos > 0) {
    const prevVal = data.code[pos - 1];
    const prevOp = Opcode.create(prevVal, ops);
    console.log('  pos=' + pos + ' val=' + data.code[pos] + ' prev=' + prevVal + (prevOp ? ' (valid: ' + prevOp.tag + ')' : ' INVALID'));
  }
}
