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

let invalidOps: {ip: number, val: number}[] = [];
for (let i = 0; i < codeSize; i++) {
  const byte = view.getUint8(pos);
  pos++;
  if (byte === 0xFF) {
    const val = view.getUint32(pos, true);
    pos += 4;
    if (val > 83) invalidOps.push({ip: i, val});
  } else if (byte > 83) {
    invalidOps.push({ip: i, val: byte});
  }
}

console.log('codeSize:', codeSize);
console.log('lineBreaks:', lineBreaks);
console.log('Total invalid opcodes:', invalidOps.length);
console.log('First 20 invalid opcodes:');
for (let i = 0; i < Math.min(20, invalidOps.length); i++) {
  console.log('  ip=' + invalidOps[i].ip + ' val=' + invalidOps[i].val);
}

// Read identifier table
const lbEnd = pos + lineBreaks * 2 * 4;
const idCount = view.getUint32(lbEnd, true);
let idPositions = new Set<number>();
let idPos = lbEnd + 4;
for (let i = 0; i < idCount; i++) {
  const strIdx = view.getUint32(idPos, true); idPos += 4;
  const count = view.getUint32(idPos, true); idPos += 4;
  for (let j = 0; j < count; j++) {
    const ip = view.getUint32(idPos, true); idPos += 4;
    idPositions.add(ip);
  }
}

let patched = 0, unpatched = 0;
for (const op of invalidOps) {
  if (idPositions.has(op.ip)) patched++;
  else unpatched++;
}
console.log('Patched:', patched, 'Unpatched:', unpatched);
