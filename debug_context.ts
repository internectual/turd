import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const c = new Compiler('TGE10');
const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const b = c.compile(code);

const view = new DataView(b.buffer);
let pos = 0;
view.getUint32(pos, true); pos += 4;
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

// Read code stream and find ALL values > 83 with their positions
let streamValues: {ip: number, val: number}[] = [];
let ip = 0;
while (ip < codeSize) {
  const byte = view.getUint8(pos);
  pos++;
  if (byte === 0xFF) {
    const val = view.getUint32(pos, true);
    pos += 4;
    streamValues.push({ip, val});
  } else {
    streamValues.push({ip, val: byte});
  }
  ip++;
}

// Read identifier table
const idCount = view.getUint32(pos, true);
pos += 4;
let idTable: Map<number, number> = new Map(); // ip -> strIdx
for (let i = 0; i < idCount; i++) {
  const strIdx = view.getUint32(pos, true); pos += 4;
  const count = view.getUint32(pos, true); pos += 4;
  for (let j = 0; j < count; j++) {
    const ipVal = view.getUint32(pos, true); pos += 4;
    idTable.set(ipVal, strIdx);
  }
}

// For each value > 83, check if it's in the identifier table
let patched = 0, unpatched = 0;
let unpatchedList: {ip: number, val: number}[] = [];
for (const sv of streamValues) {
  if (sv.val > 83) {
    if (idTable.has(sv.ip)) {
      patched++;
    } else {
      unpatched++;
      if (unpatchedList.length < 20) unpatchedList.push(sv);
    }
  }
}

console.log('Values > 83:', patched + unpatched);
console.log('Patched by id table:', patched);
console.log('Unpatched:', unpatched);
console.log('\nFirst 20 unpatched:');
for (const u of unpatchedList) {
  // Show surrounding context
  const context = streamValues.slice(Math.max(0, u.ip - 3), u.ip + 4).map(s => s.val).join(',');
  console.log('  ip=' + u.ip + ' val=' + u.val + ' context=[' + context + ']');
}
