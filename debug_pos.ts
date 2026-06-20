import { Compiler } from './src/compiler/index';
import { FileLoader, FileReader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const compiler = new Compiler('TGE10');
const bytecode = compiler.compile(code);
console.log('Bytecode length:', bytecode.length);

// Parse manually to find expected positions
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

console.log('Header size:', pos);
console.log('codeSize:', codeSize, 'lineBreaks:', lineBreaks);

// Count code bytes
let codeBytes = 0;
for (let i = 0; i < codeSize; i++) {
  const b = view.getUint8(pos + codeBytes);
  codeBytes++;
  if (b === 0xFF) codeBytes += 4;
}
console.log('Code bytes:', codeBytes);
console.log('Code end:', pos + codeBytes);

// Line break pairs
const lbStart = pos + codeBytes;
const lbEnd = lbStart + lineBreaks * 2 * 4;
console.log('Line breaks:', lbStart, '-', lbEnd);

// Jump target table
const jtStart = lbEnd;
const jtCount = view.getUint32(jtStart, true);
const jtEnd = jtStart + 4 + jtCount * 8;
console.log('Jump targets:', jtStart, '-', jtEnd, 'count:', jtCount);

// Identifier table
const itStart = jtEnd;
const itCount = view.getUint32(itStart, true);
console.log('Identifier table:', itStart, 'count:', itCount);

// Check if positions are within bounds
console.log('Bytecode length:', bytecode.length);
console.log('It start < length:', itStart < bytecode.length);
