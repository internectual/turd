import { Compiler } from './src/compiler/index';
import { decompile, FileLoader, Opcode } from './src/decompiler';

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');

// Manually parse the DSO
const view = new DataView(b.buffer);
let pos = 0;
const version = view.getUint32(pos, true); pos += 4;
const globalStrLen = view.getUint32(pos, true); pos += 4;
const globalStr = new TextDecoder().decode(b.slice(pos, pos + globalStrLen));
pos += globalStrLen;
const globalFloatCount = view.getUint32(pos, true); pos += 4;
pos += globalFloatCount * 8;
const funcStrLen = view.getUint32(pos, true); pos += 4;
const funcStr = new TextDecoder().decode(b.slice(pos, pos + funcStrLen));
pos += funcStrLen;
const funcFloatCount = view.getUint32(pos, true); pos += 4;
pos += funcFloatCount * 8;
const codeSize = view.getUint32(pos, true); pos += 4;
const lineBreaks = view.getUint32(pos, true); pos += 4;

console.log('version:', version);
console.log('globalStr:', JSON.stringify(globalStr));
console.log('funcStr:', JSON.stringify(funcStr));
console.log('codeSize:', codeSize);
console.log('lineBreaks:', lineBreaks);

// Read opcodes
console.log('\nOpcodes:');
let ip = 0;
while (ip < codeSize) {
  const byte = view.getUint8(pos);
  pos++;
  if (byte === 0xFF) {
    const val = view.getUint32(pos, true);
    pos += 4;
    const op = Opcode.create(val, new (require('./src/decompiler').Ops)());
    console.log(`  [${ip}] EXT: ${val} (${op?.name ?? 'UNKNOWN'})`);
  } else {
    const op = Opcode.create(byte, new (require('./src/decompiler').Ops)());
    console.log(`  [${ip}] ${byte} (${op?.name ?? 'UNKNOWN'})`);
  }
  ip++;
}

// Read identifier table
const lbEnd = pos + lineBreaks * 2 * 4;
console.log('\nLine break pairs end at:', lbEnd);
const idCount = view.getUint32(lbEnd, true);
console.log('Identifier entries:', idCount);
let idPos = lbEnd + 4;
for (let i = 0; i < idCount; i++) {
  const strIdx = view.getUint32(idPos, true); idPos += 4;
  const count = view.getUint32(idPos, true); idPos += 4;
  const positions: number[] = [];
  for (let j = 0; j < count; j++) {
    positions.push(view.getUint32(idPos, true)); idPos += 4;
  }
  console.log(`  strIdx=${strIdx} count=${count} positions=${positions.join(',')}`);
}
