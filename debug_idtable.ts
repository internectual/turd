import { Compiler } from './src/compiler/index';
import { FileLoader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);

const loader = new FileLoader();
const data = loader.load(b);

console.log('Code size:', data.code.length);
console.log('Identifier table size:', data.identifierTable.size);

// Show first 10 identifier table entries
let count = 0;
for (const [ip, strIdx] of data.identifierTable) {
  if (count < 10) {
    console.log(`  ip=${ip} strIdx=${strIdx} codeVal=${data.code[ip]}`);
    count++;
  }
}

// Show first 10 invalid opcodes
console.log('\nFirst 10 invalid opcodes:');
let invalidCount = 0;
for (let i = 0; i < data.code.length && invalidCount < 10; i++) {
  if (data.code[i] > 83) {
    console.log(`  ip=${i} val=${data.code[i]} inIdTable=${data.identifierTable.has(i)}`);
    invalidCount++;
  }
}
