import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const c = new Compiler('TGE10');
const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const b = c.compile(code);

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
console.log('Header ends at byte:', pos);

// Read code stream (variable length opcodes)
let invalidOps: {ip: number, val: number}[] = [];
let ip = 0;
while (ip < codeSize) {
  const byte = view.getUint8(pos);
  pos++;
  if (byte === 0xFF) {
    const val = view.getUint32(pos, true);
    pos += 4;
    if (val > 83) invalidOps.push({ip, val});
  } else {
    if (byte > 83) invalidOps.push({ip, val: byte});
  }
  ip++;
}

console.log('Code ends at byte:', pos);
console.log('Invalid opcodes:', invalidOps.length);

// Read identifier table
const idCount = view.getUint32(pos, true);
pos += 4;
console.log('Identifier entries:', idCount);

let idPositions = new Set<number>();
for (let i = 0; i < idCount; i++) {
  const strIdx = view.getUint32(pos, true); pos += 4;
  const count = view.getUint32(pos, true); pos += 4;
  for (let j = 0; j < count; j++) {
    const ipVal = view.getUint32(pos, true); pos += 4;
    idPositions.add(ipVal);
  }
}

console.log('Identifier table positions:', idPositions.size);

// Check first 10 invalid opcodes
let patched = 0, unpatched = 0;
for (const op of invalidOps) {
  if (idPositions.has(op.ip)) patched++;
  else unpatched++;
}
console.log('Patched:', patched, 'Unpatched:', unpatched);

// Show first 10 unpatched
let shown = 0;
for (const op of invalidOps) {
  if (!idPositions.has(op.ip)) {
    console.log('  ip=' + op.ip + ' val=' + op.val);
    shown++;
    if (shown >= 10) break;
  }
}
