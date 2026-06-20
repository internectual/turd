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

console.log('CodeSize:', codeSize);
console.log('Code stream starts at byte:', pos);

// Read opcodes around position 256
let bytePos = pos;
for (let i = 0; i < codeSize && i < 270; i++) {
  const byte = view.getUint8(bytePos);
  bytePos++;
  if (byte === 0xFF) {
    const val = view.getUint32(bytePos, true);
    bytePos += 4;
    if (i >= 250 && i <= 260) {
      console.log('  [' + i + '] = ' + val + ' (extended) ***');
    }
  } else {
    if (i >= 250 && i <= 260) {
      console.log('  [' + i + '] = ' + byte);
    }
  }
}
