import { Compiler } from './src/compiler/index';
import { FileLoader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

console.log('Positions 10-25:');
for (let i = 10; i < 25; i++) {
  const val = data.code[i];
  const inIdentTable = data.identifierTable.has(i);
  const identInfo = inIdentTable ? ' (identTable strIdx=' + data.identifierTable.get(i) + ')' : '';
  console.log('  [' + i + '] = ' + val + identInfo);
}

console.log('\nIdentifier table entries 10-25:');
for (const [ip, strIdx] of data.identifierTable) {
  if (ip >= 10 && ip <= 25) {
    const entry = data.globalStringTable.get(strIdx);
    console.log('  ip=' + ip + ' strIdx=' + strIdx + ' string="' + (entry?.string || 'N/A') + '"');
  }
}
