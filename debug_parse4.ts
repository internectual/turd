import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');

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

// Read code stream
let ip = 0;
while (ip < codeSize) {
  const byte = view.getUint8(pos);
  pos++;
  if (byte === 0xFF) {
    const val = view.getUint32(pos, true);
    pos += 4;
  }
  ip++;
}
console.log('Code ends at byte:', pos);

// Read line break pairs
for (let i = 0; i < lineBreaks * 2; i++) {
  const val = view.getUint32(pos, true);
  pos += 4;
}
console.log('Line break pairs end at byte:', pos);

// Read identifier table
const idCount = view.getUint32(pos, true); pos += 4;
console.log('Identifier entries:', idCount);
for (let i = 0; i < idCount; i++) {
  const strIdx = view.getUint32(pos, true); pos += 4;
  const count = view.getUint32(pos, true); pos += 4;
  const positions: number[] = [];
  for (let j = 0; j < count; j++) {
    positions.push(view.getUint32(pos, true)); pos += 4;
  }
  console.log(`  strIdx=${strIdx} count=${count} positions=[${positions.join(',')}]`);
}
console.log('Identifier table ends at byte:', pos);
console.log('Buffer length:', b.length);
