import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);

// Parse header manually
const view = new DataView(b.buffer);
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

console.log('codeSize:', codeSize);
console.log('lineBreaks:', lineBreaks);
console.log('Header ends at byte:', pos);

// Count opcodes
let opcodeCount = 0;
let codeEnd = pos;
while (opcodeCount < codeSize && codeEnd < b.length) {
  const byte = view.getUint8(codeEnd);
  codeEnd++;
  if (byte === 0xFF) {
    codeEnd += 4;
  }
  opcodeCount++;
}
console.log('Actual opcodes:', opcodeCount);
console.log('Code ends at byte:', codeEnd);

// Line break pairs
const lbStart = codeEnd;
const lbEnd = lbStart + lineBreaks * 2 * 4;
console.log('Line break pairs: ' + lbStart + ' to ' + lbEnd);
console.log('Buffer length:', b.length);
console.log('Enough data for line breaks:', lbEnd <= b.length);

if (lbEnd > b.length) {
  console.log('ERROR: Not enough data for line break pairs!');
  console.log('  Need:', lineBreaks * 2 * 4, 'bytes');
  console.log('  Available:', b.length - lbStart, 'bytes');
}
