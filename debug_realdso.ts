import * as fs from 'fs';

const buf = fs.readFileSync('/home/methodown/Downloads/GameGui.cs.dso');
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

// Read header
let pos = 0;
const version = view.getUint32(pos, true); pos += 4;
console.log('version:', version);

const globalStrLen = view.getUint32(pos, true); pos += 4;
console.log('globalStrLen:', globalStrLen);
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
console.log('code starts at byte:', pos);

// Read first 20 opcodes
console.log('\nFirst 20 opcodes:');
for (let i = 0; i < Math.min(20, codeSize); i++) {
  const byte = view.getUint8(pos);
  pos++;
  let val = byte;
  if (byte === 0xFF) {
    val = view.getUint32(pos, true);
    pos += 4;
  }
  console.log(`  [${i}] ${val}${byte === 0xFF ? ' (EXT)' : ''}`);
}

// Skip to identifier table
let codeEnd = 35; // approximate header size
// Re-read to find exact position
pos = 35; // after header
for (let i = 0; i < codeSize; i++) {
  const byte = view.getUint8(pos);
  pos++;
  if (byte === 0xFF) pos += 4;
}
console.log('\nCode ends at byte:', pos);

// Read line break pairs
console.log('Reading', lineBreaks * 2, 'line break pairs...');
pos += lineBreaks * 2 * 4;
console.log('Line break pairs end at byte:', pos);

// Read identifier table
if (pos + 4 <= buf.length) {
  const idCount = view.getUint32(pos, true); pos += 4;
  console.log('Identifier entries:', idCount);
  for (let i = 0; i < Math.min(idCount, 5); i++) {
    const strIdx = view.getUint32(pos, true); pos += 4;
    const count = view.getUint32(pos, true); pos += 4;
    const positions: number[] = [];
    for (let j = 0; j < count; j++) {
      positions.push(view.getUint32(pos, true)); pos += 4;
    }
    console.log(`  strIdx=${strIdx} count=${count} positions=[${positions.slice(0,5).join(',')}${count > 5 ? '...' : ''}]`);
  }
}
console.log('Identifier table ends at byte:', pos);
console.log('Buffer length:', buf.length);
