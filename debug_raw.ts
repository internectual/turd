import { Compiler } from './src/compiler/index';
import { FileLoader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

console.log('codeSize:', data.code.length);
console.log('\nOpcodes 250-265:');
for (let i = 250; i < 265; i++) {
  console.log('  [' + i + '] = ' + data.code[i]);
}

console.log('\nIdentifier table entries around 250-265:');
for (const [ip, strIdx] of data.identifierTable) {
  if (ip >= 250 && ip <= 265) {
    console.log('  ip=' + ip + ' strIdx=' + strIdx);
  }
}
