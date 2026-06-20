import { Compiler } from './src/compiler/index';
import { FileLoader, decompile, FileReader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);

// Manually read the DSO file using FileReader
const reader = new FileReader(new Uint8Array(b));

const version = reader.readUInt();
console.log('Version:', version);

// Global string table
const globalStrLen = reader.readUInt();
console.log('GlobalStrLen:', globalStrLen);
const globalStrData = new Uint8Array(globalStrLen);
for (let i = 0; i < globalStrLen; i++) {
  globalStrData[i] = reader.readByte();
}

// Global float table
const globalFloatCount = reader.readUInt();
console.log('GlobalFloatCount:', globalFloatCount);
for (let i = 0; i < globalFloatCount; i++) {
  reader.readDouble();
}

// Function string table
const funcStrLen = reader.readUInt();
console.log('FuncStrLen:', funcStrLen);
const funcStrData = new Uint8Array(funcStrLen);
for (let i = 0; i < funcStrLen; i++) {
  funcStrData[i] = reader.readByte();
}

// Function float table
const funcFloatCount = reader.readUInt();
console.log('FuncFloatCount:', funcFloatCount);
for (let i = 0; i < funcFloatCount; i++) {
  reader.readDouble();
}

// Code size and line breaks
const codeSize = reader.readUInt();
const lineBreaks = reader.readUInt();
console.log('CodeSize:', codeSize, 'LineBreaks:', lineBreaks);

// Read code stream manually
console.log('\nReading code stream...');
const codeStream = [];
for (let i = 0; i < codeSize; i++) {
  const byte = reader.readByte();
  if (byte === 0xFF) {
    const val = reader.readUInt();
    codeStream.push(val);
  } else {
    codeStream.push(byte);
  }
}

console.log('Code stream length:', codeStream.length);
console.log('First 20:', codeStream.slice(0, 20));
console.log('Around 250-260:', codeStream.slice(250, 270));

// Check if codeStream matches data.code
const loader = new FileLoader();
const data = loader.load(new Uint8Array(b));
console.log('\ndata.code length:', data.code.length);
console.log('data.code[250-270]:', Array.from(data.code.slice(250, 270)));

// Compare
let mismatch = false;
for (let i = 0; i < Math.min(codeStream.length, data.code.length); i++) {
  if (codeStream[i] !== data.code[i]) {
    console.log('MISMATCH at', i + ': manual=' + codeStream[i] + ' data=' + data.code[i]);
    mismatch = true;
    if (i > 260) break;
  }
}
if (!mismatch) {
  console.log('Code streams match!');
}
