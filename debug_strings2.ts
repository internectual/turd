import { Compiler } from './src/compiler/index';
import { FileLoader, Opcode, Ops, OpcodeTag } from './src/decompiler';
import * as fs from 'fs';

const ops = new Ops();
const T = OpcodeTag;

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

// Check identifier table around position 645-660
console.log('Identifier table entries 645-660:');
for (const [ip, strIdx] of data.identifierTable) {
  if (ip >= 645 && ip <= 660) {
    const entry = data.globalStringTable.get(strIdx);
    console.log('  ip=' + ip + ' strIdx=' + strIdx + ' string="' + (entry?.string || 'N/A') + '"');
  }
}

// Also check function string table
console.log('\nFunction string table:');
for (const [offset, entry] of data.functionStringTable.entries) {
  console.log('  offset=' + offset + ' string="' + entry.string + '"');
}

// Check global string table
console.log('\nGlobal string table:');
for (const [offset, entry] of data.globalStringTable.entries) {
  console.log('  offset=' + offset + ' string="' + entry.string + '"');
}
