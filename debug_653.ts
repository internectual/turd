import { Compiler } from './src/compiler/index';
import { decompile, FileLoader, Opcode, Ops } from './src/decompiler';
import * as fs from 'fs';

const c = new Compiler('TGE10');
const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const b = c.compile(code);

const loader = new FileLoader();
const data = loader.load(b);

console.log('codeSize:', data.code.length);
console.log('identifierTable size:', data.identifierTable.size);

// Find position 653 and surrounding context
const ip = 653;
console.log(`\nAround ip=${ip}:`);
for (let i = Math.max(0, ip - 5); i < Math.min(data.code.length, ip + 5); i++) {
  const inId = data.identifierTable.has(i);
  const val = data.code[i];
  const isInvalid = val > 83;
  const marker = i === ip ? ' <-- PROBLEM' : '';
  console.log(`  [${ip}] val=${val} invalid=${isInvalid} inIdTable=${inId}${marker}`);
}

// Check how many positions are in the identifier table
let positions = Array.from(data.identifierTable.keys());
console.log(`\nIdentifier table positions (first 20):`, positions.slice(0, 20));
console.log(`Identifier table positions around 653:`, positions.filter(p => p >= 645 && p <= 665));

// Count invalid opcodes
let invalidCount = 0;
for (let i = 0; i < data.code.length; i++) {
  if (data.code[i] > 83) invalidCount++;
}
console.log('\nTotal invalid opcodes:', invalidCount);
