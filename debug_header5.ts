import { Compiler } from './src/compiler/index';

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');
console.log('Bytecode length:', b.length);

const view = new DataView(b.buffer);
let pos = 0;

// Version
const version = view.getUint32(pos, true); pos += 4;
console.log('pos after version:', pos);

// Global string table
const globalStrLen = view.getUint32(pos, true); pos += 4;
console.log('globalStrLen:', globalStrLen, 'pos:', pos);
pos += globalStrLen;
console.log('pos after globalStr:', pos);

// Global float table
const globalFloatCount = view.getUint32(pos, true); pos += 4;
console.log('globalFloatCount:', globalFloatCount, 'pos:', pos);
pos += globalFloatCount * 8;
console.log('pos after globalFloat:', pos);

// Function string table
const funcStrLen = view.getUint32(pos, true); pos += 4;
console.log('funcStrLen:', funcStrLen, 'pos:', pos);
pos += funcStrLen;
console.log('pos after funcStr:', pos);

// Function float table
const funcFloatCount = view.getUint32(pos, true); pos += 4;
console.log('funcFloatCount:', funcFloatCount, 'pos:', pos);
pos += funcFloatCount * 8;
console.log('pos after funcFloat:', pos);

// Code size
const codeSize = view.getUint32(pos, true); pos += 4;
console.log('codeSize:', codeSize, 'pos:', pos);

// Line breaks
const lineBreaks = view.getUint32(pos, true); pos += 4;
console.log('lineBreaks:', lineBreaks, 'pos:', pos);

// Code stream
console.log('Code stream starts at byte:', pos);
let ip = 0;
while (ip < codeSize) {
  const byte = view.getUint8(pos);
  pos++;
  if (byte === 0xFF) {
    pos += 4;
  }
  ip++;
}
console.log('Code stream ends at byte:', pos);

// Line break pairs
console.log('Line break pairs start at byte:', pos);
pos += lineBreaks * 2 * 4;
console.log('Line break pairs end at byte:', pos);

// Identifier table
console.log('Identifier table starts at byte:', pos);
if (pos + 4 <= b.length) {
  const idCount = view.getUint32(pos, true); pos += 4;
  console.log('idCount:', idCount);
  for (let i = 0; i < idCount; i++) {
    const strIdx = view.getUint32(pos, true); pos += 4;
    const count = view.getUint32(pos, true); pos += 4;
    const positions: number[] = [];
    for (let j = 0; j < count; j++) {
      positions.push(view.getUint32(pos, true)); pos += 4;
    }
    console.log(`  strIdx=${strIdx} count=${count} positions=[${positions.join(',')}]`);
  }
}
console.log('Identifier table ends at byte:', pos);
console.log('Buffer length:', b.length);
