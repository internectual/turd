import * as fs from 'fs';

const buf = fs.readFileSync('/home/methodown/Downloads/GameGui.cs.dso');
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

let pos = 0;
const version = view.getUint32(pos, true); pos += 4;
console.log('pos after version:', pos);

const globalStrLen = view.getUint32(pos, true); pos += 4;
console.log('globalStrLen:', globalStrLen, 'pos:', pos);
pos += globalStrLen;
console.log('pos after globalStr:', pos);

const globalFloatCount = view.getUint32(pos, true); pos += 4;
console.log('globalFloatCount:', globalFloatCount, 'pos:', pos);
pos += globalFloatCount * 8;
console.log('pos after globalFloat:', pos);

const funcStrLen = view.getUint32(pos, true); pos += 4;
console.log('funcStrLen:', funcStrLen, 'pos:', pos);
pos += funcStrLen;
console.log('pos after funcStr:', pos);

const funcFloatCount = view.getUint32(pos, true); pos += 4;
console.log('funcFloatCount:', funcFloatCount, 'pos:', pos);
pos += funcFloatCount * 8;
console.log('pos after funcFloat:', pos);

const codeSize = view.getUint32(pos, true); pos += 4;
const lineBreaks = view.getUint32(pos, true); pos += 4;
console.log('codeSize:', codeSize, 'lineBreaks:', lineBreaks);
console.log('pos after header:', pos);

// Header is 20 bytes: version(4) + globalStrLen(4) + globalFloatCount(4) + funcStrLen(4) + funcFloatCount(4) + codeSize(4) + lineBreaks(4) = 28 bytes
// Total header = 20 + globalStrLen + globalFloatCount*8 + funcStrLen + funcFloatCount*8
const expectedHeaderSize = 28 + globalStrLen + globalFloatCount*8 + funcStrLen + funcFloatCount*8;
console.log('Expected header size:', expectedHeaderSize);
console.log('Actual pos:', pos);
console.log('Match:', expectedHeaderSize === pos);

// Now read code stream properly
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

// Skip to identifier table - recalculate code start
let codeStartExpected = expectedHeaderSize;
console.log('\nRecalculating code start from beginning...');
let p = 28 + globalStrLen + globalFloatCount*8 + funcStrLen + funcFloatCount*8;
console.log('Code starts at:', p);

// Read code stream
p = codeStartExpected;
for (let i = 0; i < codeSize; i++) {
  const byte = view.getUint8(p);
  p++;
  if (byte === 0xFF) p += 4;
}
console.log('Code ends at:', p);

// Read line break pairs
console.log('Reading', lineBreaks * 2, 'line break pairs...');
p += lineBreaks * 2 * 4;
console.log('Line break pairs end at:', p);

// Read identifier table
if (p + 4 <= buf.length) {
  const idCount = view.getUint32(p, true); p += 4;
  console.log('Identifier entries:', idCount);
  for (let i = 0; i < Math.min(idCount, 5); i++) {
    const strIdx = view.getUint32(p, true); p += 4;
    const count = view.getUint32(p, true); p += 4;
    const positions: number[] = [];
    for (let j = 0; j < Math.min(count, 5); j++) {
      positions.push(view.getUint32(p, true)); p += 4;
    }
    console.log(`  strIdx=${strIdx} count=${count} firstPositions=[${positions.join(',')}]`);
  }
}
console.log('Identifier table ends at:', p);
console.log('Buffer length:', buf.length);
console.log('Remaining bytes:', buf.length - p);
