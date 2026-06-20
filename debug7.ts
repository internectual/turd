import { Compiler } from './src/compiler/index';
import { FileLoader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const compiler = new Compiler('TGE10');
const bytecode = compiler.compile(code);

// Parse header manually
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

console.log('Header size:', pos);
console.log('codeSize:', codeSize);
console.log('lineBreaks:', lineBreaks);
console.log('Code stream: bytes', pos, 'to', pos + codeSize - 1);
console.log('Line breaks: bytes', pos + codeSize, 'to', pos + codeSize + lineBreaks * 2 * 4 - 1);

// Use FileLoader
const data = new FileLoader().load(new Uint8Array(bytecode));
console.log('FileLoader code length:', data.code.length);
console.log('Expected code length:', codeSize);
