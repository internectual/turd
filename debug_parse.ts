import { Compiler } from './src/compiler/index';
import { FileLoader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);

// Manually parse the header
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

console.log('Header: codeSize=' + codeSize + ' lineBreaks=' + lineBreaks);
console.log('Header ends at byte:', pos);

// Read code stream
const opcodes = [];
let codeBytes = 0;
for (let i = 0; i < codeSize; i++) {
  const byte = view.getUint8(pos);
  pos++;
  codeBytes++;
  if (byte === 0xFF) {
    const val = view.getUint32(pos, true);
    pos += 4;
    codeBytes += 4;
    opcodes.push(val);
  } else {
    opcodes.push(byte);
  }
}
console.log('Code stream ends at byte:', pos);
console.log('Code bytes:', codeBytes);

// Read line break pairs
console.log('Line break pairs start at byte:', pos);
const lbStart = pos;
for (let i = 0; i < lineBreaks * 2; i++) {
  if (pos + 4 > b.length) {
    console.log('ERROR: Not enough data for line break pair ' + i + '/' + (lineBreaks * 2));
    console.log('  pos=' + pos + ' buffer length=' + b.length);
    break;
  }
  pos += 4;
}
console.log('Line break pairs end at byte:', pos);

// Read identifier table
console.log('Identifier table start at byte:', pos);
if (pos + 4 > b.length) {
  console.log('ERROR: Not enough data for identifier table size');
} else {
  const idCount = view.getUint32(pos, true); pos += 4;
  console.log('Identifier entries:', idCount);
  for (let i = 0; i < idCount; i++) {
    if (pos + 12 > b.length) {
      console.log('ERROR: Not enough data for identifier entry ' + i);
      break;
    }
    const strIdx = view.getUint32(pos, true); pos += 4;
    const count = view.getUint32(pos, true); pos += 4;
    for (let j = 0; j < count; j++) {
      if (pos + 4 > b.length) {
        console.log('ERROR: Not enough data for identifier position');
        break;
      }
      pos += 4;
    }
  }
  console.log('Identifier table end at byte:', pos);
  console.log('Buffer length:', b.length);
  console.log('Match:', pos === b.length);
}

// Check for invalid opcodes
let invalidCount = 0;
for (let i = 0; i < opcodes.length; i++) {
  if (opcodes[i] > 83) {
    invalidCount++;
    if (invalidCount <= 5) {
      console.log('Invalid opcode at ip=' + i + ' val=' + opcodes[i]);
    }
  }
}
console.log('Total invalid opcodes:', invalidCount);
