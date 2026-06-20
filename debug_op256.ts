import { Compiler } from './src/compiler/index';
import { FileLoader, disassemble, Ops } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);

const loader = new FileLoader();
const data = loader.load(new Uint8Array(b));
const ops = new Ops();
const reader = { data, ops, idx: 0, returnableValue: false };

// Manually read code stream
console.log('codeSize:', data.code.length);
console.log('First 10 opcodes:', data.code.slice(0, 10));
console.log('Opcodes around 252-260:', data.code.slice(250, 260));
console.log('Opcode at 256:', data.code[256]);

// Check if opcode 0 is valid
console.log('isValid(0):', ops.isValid(0));
console.log('isValid(292):', ops.isValid(292));
console.log('isValid(70):', ops.isValid(70));

// Check the opcode at position 252
console.log('Opcode at 252:', data.code[252]);
console.log('Is 292 valid?', ops.isValid(292));
