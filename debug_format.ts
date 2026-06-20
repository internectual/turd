import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const c = new Compiler('TGE10');
const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const b = c.compile(code);
console.log('Buffer length:', b.length);

const view = new DataView(b.buffer);
let pos = 0;

// Parse header
const version = view.getUint32(pos, true); pos += 4;
const globalStrLen = view.getUint32(pos, true); pos += 4;
console.log('version:', version, 'globalStrLen:', globalStrLen);
pos += globalStrLen;

const globalFloatCount = view.getUint32(pos, true); pos += 4;
console.log('globalFloatCount:', globalFloatCount);
pos += globalFloatCount * 8;

const funcStrLen = view.getUint32(pos, true); pos += 4;
console.log('funcStrLen:', funcStrLen);
pos += funcStrLen;

const funcFloatCount = view.getUint32(pos, true); pos += 4;
console.log('funcFloatCount:', funcFloatCount);
pos += funcFloatCount * 8;

const codeSize = view.getUint32(pos, true); pos += 4;
const lineBreaks = view.getUint32(pos, true); pos += 4;
console.log('codeSize:', codeSize, 'lineBreaks:', lineBreaks);

// Skip code stream (variable-length opcodes)
let ip = 0;
while (ip < codeSize) {
  const byte = view.getUint8(pos);
  pos++;
  if (byte === 0xFF) {
    pos += 4;
  }
  ip++;
}
console.log('Code ends at byte:', pos);

// Skip line break pairs
console.log('Reading', lineBreaks * 2, 'line break pairs');
pos += lineBreaks * 2 * 4;
console.log('Line break pairs end at byte:', pos);

// Read identifier table
if (pos + 4 <= b.length) {
  const idCount = view.getUint32(pos, true); pos += 4;
  console.log('Identifier entries:', idCount);
  
  for (let i = 0; i < idCount; i++) {
    if (pos + 8 > b.length) {
      console.log('Not enough data for entry', i);
      break;
    }
    const strIdx = view.getUint32(pos, true); pos += 4;
    const count = view.getUint32(pos, true); pos += 4;
    
    if (pos + count * 4 > b.length) {
      console.log('Not enough data for positions of entry', i, 'count:', count);
      break;
    }
    
    const positions: number[] = [];
    for (let j = 0; j < count; j++) {
      positions.push(view.getUint32(pos, true)); pos += 4;
    }
    if (i < 5 || positions.some(p => p >= 645 && p <= 665)) {
      console.log(`  entry ${i}: strIdx=${strIdx} count=${count} positions=[${positions.slice(0, 10).join(',')}${positions.length > 10 ? '...' : ''}]`);
    }
  }
}
console.log('Final pos:', pos, 'Buffer length:', b.length);
