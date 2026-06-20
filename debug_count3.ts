import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const c = new Compiler('TGE10');
const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
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

let invalidCount = 0;
let firstFew: {ip: number, val: number}[] = [];
for (let i = 0; i < codeSize; i++) {
  const byte = view.getUint8(pos);
  pos++;
  if (byte === 0xFF) {
    const val = view.getUint32(pos, true);
    pos += 4;
    if (val > 83) { invalidCount++; if (firstFew.length < 10) firstFew.push({ip: i, val}); }
  } else if (byte > 83) {
    invalidCount++;
    if (firstFew.length < 10) firstFew.push({ip: i, val: byte});
  }
}

console.log('codeSize:', codeSize);
console.log('lineBreaks:', lineBreaks);
console.log('Invalid opcodes:', invalidCount);
console.log('First 10:', firstFew);
