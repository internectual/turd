import { Compiler } from './src/compiler/index';
import { FileLoader, Opcode, Ops } from './src/decompiler';
import * as fs from 'fs';

const ops = new Ops();
const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

console.log('codeSize:', data.code.length);
console.log('Opcodes 250-265:');
for (let i = 250; i < 265; i++) {
  const val = data.code[i];
  const op = Opcode.create(val, ops);
  console.log('  [' + i + '] = ' + val + (op ? ' (valid: ' + op.tag + ')' : ' *** INVALID ***'));
}
