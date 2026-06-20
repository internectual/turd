import { Compiler } from './src/compiler/index';

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');

// Hex dump bytes 35-70
console.log('Bytes 35-70:');
for (let i = 35; i < Math.min(b.length, 70); i++) {
  process.stdout.write(b[i].toString(16).padStart(2, '0') + ' ');
  if ((i - 35 + 1) % 16 === 0) process.stdout.write('\n');
}
console.log();

// Parse manually
const view = new DataView(b.buffer);
let pos = 35;

// Code stream (11 bytes)
console.log('Code stream:');
for (let i = 0; i < 11; i++) {
  const op = view.getUint8(pos++);
  console.log(`  [${i}] ${op}`);
}

// Line break pairs (2 u32s)
console.log('Line break pairs:');
for (let i = 0; i < 2; i++) {
  const v = view.getUint32(pos, true);
  pos += 4;
  console.log(`  ${v}`);
}

// Identifier table
console.log('Identifier table:');
const idCount = view.getUint32(pos, true); pos += 4;
console.log(`  idCount: ${idCount}`);
for (let i = 0; i < idCount; i++) {
  const strIdx = view.getUint32(pos, true); pos += 4;
  const count = view.getUint32(pos, true); pos += 4;
  const positions: number[] = [];
  for (let j = 0; j < count; j++) {
    positions.push(view.getUint32(pos, true)); pos += 4;
  }
  console.log(`  strIdx=${strIdx} count=${count} positions=[${positions.join(',')}]`);
}
