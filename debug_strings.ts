import { Compiler } from './src/compiler/index';
import { FileLoader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

console.log('Global string table entries:', data.globalStringTable.entries.size);
console.log('Function string table entries:', data.functionStringTable.entries.size);
console.log('Identifier table entries:', data.identifierTable.size);

// Check the string table
console.log('\nGlobal string table raw length:', data.globalStringTable.raw.length);
console.log('Function string table raw length:', data.functionStringTable.raw.length);

// Check what's at position 252 in the code stream
console.log('\nCode stream[252]:', data.code[252]);
console.log('Code stream[256]:', data.code[256]);

// Check if 292 and 101 could be string table indices
// The global string table has entries at specific offsets
console.log('\nGlobal string table entries:');
for (const [offset, entry] of data.globalStringTable.entries) {
  if (offset >= 280 && offset <= 300) {
    console.log('  offset=' + offset + ' string="' + entry.string + '"');
  }
}

console.log('\nFunction string table entries:');
for (const [offset, entry] of data.functionStringTable.entries) {
  if (offset >= 90 && offset <= 110) {
    console.log('  offset=' + offset + ' string="' + entry.string + '"');
  }
}
