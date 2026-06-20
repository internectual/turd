import { Compiler } from './src/compiler/index';
import { FileLoader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const compiler = new Compiler('TGE10');
const bytecode = compiler.compile(code);

// Parse header manually
const view = new DataView(bytecode.buffer);
let pos = 0;
const version = view.getUint32(pos, true); pos += 4;
const globalStrLen = view.getUint32(pos, true); pos += 4;
pos += globalStrLen;
const globalFloatCount = view.getUint32(pos, true); pos += 4;
pos += globalFloatCount * 8;
const funcStrLen = view.getUint32(pos, true); pos += 4;
pos += funcStrLen;
const funcFloatCount = view.getUint32(pos, true); pos += 4;
pos += funcFloatCount * 8;
const codeSize = view.getUint32(pos, true); pos += 4;
const lineBreaks = view.getUint32(pos, true); pos += 4;

console.log('codeSize from header:', codeSize);
console.log('lineBreaks from header:', lineBreaks);
console.log('Header ends at byte:', pos);

// Read code stream as u32s
const codeEnd = pos + codeSize * 4;
console.log('Code stream ends at byte:', codeEnd);
console.log('First few opcodes:');
for (let i = 0; i < Math.min(10, codeSize); i++) {
  const op = view.getUint32(pos + i * 4, true);
  console.log('  opcode', i, ':', op);
}

// Check what's at the end of the code stream
console.log('Last few opcodes:');
for (let i = Math.max(0, codeSize - 5); i < codeSize; i++) {
  const op = view.getUint32(pos + i * 4, true);
  console.log('  opcode', i, ':', op);
}

// Check bytes after code stream
console.log('Bytes after code stream:');
for (let i = 0; i < 20; i++) {
  const bytePos = codeEnd + i;
  if (bytePos < bytecode.length) {
    process.stdout.write(bytecode[bytePos].toString().padStart(3) + ' ');
  }
}
console.log();
