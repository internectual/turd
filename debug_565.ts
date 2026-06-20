import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);

const view = new DataView(b.buffer);
let pos = 14006; // skip header
const codeSize = 17870;

let invalidOps: {ip: number, val: number, context: string}[] = [];
let prevOpcode = -1;
for (let i = 0; i < Math.min(codeSize, 570); i++) {
  const byte = view.getUint8(pos);
  pos++;
  let val = byte;
  if (byte === 0xFF) {
    val = view.getUint32(pos, true);
    pos += 4;
  }
  if (val > 83) {
    invalidOps.push({ip: i, val, context: 'prev=' + prevOpcode});
  }
  prevOpcode = val;
}

console.log('Invalid opcodes before position 570:', invalidOps.length);
for (const op of invalidOps.slice(-10)) {
  console.log('  ip=' + op.ip + ' val=' + op.val);
}
