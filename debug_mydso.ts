import { Compiler } from './src/compiler/index';

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');

// Hex dump bytes 30-70
console.log('Bytes 30-70:');
for (let i = 30; i < Math.min(b.length, 70); i++) {
  process.stdout.write(b[i].toString(16).padStart(2, '0') + ' ');
  if ((i - 30 + 1) % 16 === 0) process.stdout.write('\n');
}
console.log();

// Parse manually
const view = new DataView(b.buffer);
let pos = 35; // skip header (approximately)

// Find code start by reading header properly
pos = 4; // after version
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

console.log('codeSize:', codeSize, 'lineBreaks:', lineBreaks);
console.log('code starts at byte:', pos);

// Read code stream
console.log('\nCode stream:');
for (let i = 0; i < codeSize; i++) {
  const byte = view.getUint8(pos);
  pos++;
  let val = byte;
  if (byte === 0xFF) {
    val = view.getUint32(pos, true);
    pos += 4;
  }
  console.log(`  [${i}] ${val}`);
}

// Skip line break pairs
console.log('\nLine break pairs:');
pos += lineBreaks * 2 * 4;

// Read identifier table
console.log('\nIdentifier table:');
const idCount = view.getUint32(pos, true); pos += 4;
console.log('  idCount:', idCount);
for (let i = 0; i < idCount; i++) {
  const strIdx = view.getUint32(pos, true); pos += 4;
  const count = view.getUint32(pos, true); pos += 4;
  const positions: number[] = [];
  for (let j = 0; j < count; j++) {
    positions.push(view.getUint32(pos, true)); pos += 4;
  }
  console.log(`  strIdx=${strIdx} count=${count} positions=[${positions.join(',')}]`);
}
