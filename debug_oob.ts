import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const c = new Compiler('TGE10');
const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const b = c.compile(code);

const view = new DataView(b.buffer);
let pos = 0;
view.getUint32(pos, true); pos += 4;
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

// Skip code stream
let ip = 0;
while (ip < codeSize) {
  const byte = view.getUint8(pos);
  pos++;
  if (byte === 0xFF) pos += 4;
  ip++;
}

// Skip line break pairs
pos += lineBreaks * 2 * 4;

// Read identifier table
const idCount = view.getUint32(pos, true); pos += 4;
let outOfBounds = 0;
let totalPositions = 0;

for (let i = 0; i < idCount; i++) {
  const strIdx = view.getUint32(pos, true); pos += 4;
  const count = view.getUint32(pos, true); pos += 4;
  
  for (let j = 0; j < count; j++) {
    const ipVal = view.getUint32(pos, true); pos += 4;
    totalPositions++;
    if (ipVal >= codeSize) {
      outOfBounds++;
      if (outOfBounds <= 5) {
        console.log('Out of bounds: ip=' + ipVal + ' >= codeSize=' + codeSize + ' strIdx=' + strIdx);
      }
    }
  }
}

console.log('Total identifier positions:', totalPositions);
console.log('Out of bounds:', outOfBounds);
