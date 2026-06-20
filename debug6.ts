import { Compiler } from './src/compiler/index';
import { FileLoader, FileReader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const compiler = new Compiler('TGE10');
const bytecode = compiler.compile(code);

// Manually parse to find code stream start
const view = new DataView(bytecode.buffer);
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

console.log('Manual parse - code stream starts at byte:', pos);
console.log('codeSize:', codeSize);

// Now use FileLoader
const data = new FileLoader().load(new Uint8Array(bytecode));
console.log('FileLoader code length:', data.code.length);

// The FileLoader should read codeSize entries starting at position pos
// Let's check if the values match
let mismatch = -1;
for (let i = 0; i < Math.min(100, codeSize); i++) {
  const rawVal = view.getUint32(pos + 4 + i * 4, true); // +4 for codeSize header
  const fileLoaderVal = data.code[i];
  if (rawVal !== fileLoaderVal) {
    mismatch = i;
    console.log('Mismatch at index', i, ':', 'raw=' + rawVal, 'fileLoader=' + fileLoaderVal);
    break;
  }
}
if (mismatch === -1) {
  console.log('First 100 entries match!');
}
