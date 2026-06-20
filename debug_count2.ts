import { Compiler } from './src/compiler/index';

const c = new Compiler('TGE10');
const code = require('fs').readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const b = c.compile(code);

const view = new DataView(b.buffer);
let pos = 14006; // skip header (approximate)
const codeSize = view.getUint32(14000, true); // read codeSize from header

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
console.log('Invalid opcodes:', invalidCount);
console.log('First 10:', firstFew);
