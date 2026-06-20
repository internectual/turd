import { Compiler } from './src/compiler/index';
import { FileLoader, FileReader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const compiler = new Compiler('TGE10');
const bytecode = compiler.compile(code);

// Monkey-patch FileReader to log reads
const origReadUInt = FileReader.prototype.readUInt;
FileReader.prototype.readUInt = function() {
  const result = origReadUInt.call(this);
  if (this.position < 14250 || this.position > 14300) {
    // Only log header area
  }
  return result;
};

const data = new FileLoader().load(new Uint8Array(bytecode));
console.log('Code length:', data.code.length);

// Check for bad opcodes
let badCount = 0;
for (let i = 0; i < data.code.length; i++) {
  if (data.code[i] > 83 && data.code[i] !== 0) {
    badCount++;
  }
}
console.log('Bad opcodes (>83, excluding 0):', badCount);

// Check the first 20 opcodes
console.log('First 20 opcodes:');
for (let i = 0; i < 20; i++) {
  console.log('  [' + i + ']:', data.code[i]);
}
