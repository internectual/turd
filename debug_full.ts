import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);

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

// Skip code stream
let opcodeCount = 0;
while (opcodeCount < codeSize) {
  const byte = view.getUint8(pos);
  pos++;
  if (byte === 0xFF) pos += 4;
  opcodeCount++;
}

// Skip line break pairs
pos += lineBreaks * 2 * 4;

console.log('Identifier table starts at byte:', pos);
console.log('Buffer length:', b.length);

// Read identifier table
if (pos + 4 > b.length) {
  console.log('ERROR: Not enough data for identifier count');
} else {
  const idCount = view.getUint32(pos, true); pos += 4;
  console.log('Identifier entries:', idCount);
  
  for (let i = 0; i < idCount; i++) {
    if (pos + 8 > b.length) {
      console.log('ERROR: Not enough data for identifier entry ' + i + ' (need 8 bytes, have ' + (b.length - pos) + ')');
      break;
    }
    const strIdx = view.getUint32(pos, true); pos += 4;
    const count = view.getUint32(pos, true); pos += 4;
    
    for (let j = 0; j < count; j++) {
      if (pos + 4 > b.length) {
        console.log('ERROR: Not enough data for identifier position ' + j + ' in entry ' + i);
        break;
      }
      const ip = view.getUint32(pos, true); pos += 4;
      
      // Check if this position is valid
      if (ip >= codeSize) {
        console.log('WARNING: Identifier ip=' + ip + ' >= codeSize=' + codeSize);
      }
    }
  }
  
  console.log('Identifier table ends at byte:', pos);
  console.log('Buffer length:', b.length);
  console.log('Match:', pos === b.length);
}

// Check for invalid opcodes
const data = new Uint8Array(b);
let invalidCount = 0;
let codePos = 14006; // after header
for (let i = 0; i < codeSize; i++) {
  const byte = data[codePos];
  codePos++;
  if (byte === 0xFF) {
    codePos += 4;
    // Extended opcode - read the 4-byte value
    const val = view.getUint32(codePos - 4, true);
    if (val > 83) {
      invalidCount++;
      if (invalidCount <= 5) console.log('Invalid extended opcode at ip=' + i + ' val=' + val);
    }
  } else if (byte > 83) {
    invalidCount++;
    if (invalidCount <= 5) console.log('Invalid opcode at ip=' + i + ' val=' + byte);
  }
}
console.log('Total invalid opcodes:', invalidCount);
