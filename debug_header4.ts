import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const c = new Compiler('TGE10');
const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const b = c.compile(code);

const view = new DataView(b.buffer);
let pos = 0;
view.getUint32(pos, true); pos += 4; // version
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

// Read code stream
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
console.log('Opcodes read:', opcodeCount);
console.log('Code ends at byte:', codeEnd);

// Line break pairs
const lbEnd = codeEnd + lineBreaks * 2 * 4;
console.log('Line break pairs end at:', lbEnd);
console.log('Buffer length:', b.length);
console.log('Enough data:', lbEnd <= b.length);

if (lbEnd > b.length) {
  console.log('ERROR: Not enough data for line break pairs!');
  console.log('  Need:', lineBreaks * 2 * 4, 'bytes');
  console.log('  Available:', b.length - codeEnd, 'bytes');
}
