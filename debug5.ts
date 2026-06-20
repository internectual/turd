import { Compiler } from './src/compiler/index';
import { FileLoader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const compiler = new Compiler('TGE10');
const bytecode = compiler.compile(code);
const data = new FileLoader().load(new Uint8Array(bytecode));

console.log('Code length:', data.code.length);
console.log('First 20 opcodes:');
for (let i = 0; i < 20; i++) {
  console.log('  [' + i + ']:', data.code[i]);
}

// Count bad opcodes
let badCount = 0;
for (let i = 0; i < data.code.length; i++) {
  if (data.code[i] > 83 && data.code[i] !== 0) badCount++;
}
console.log('Bad opcodes:', badCount);
