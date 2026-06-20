import { Compiler, OpCode } from './src/compiler/index';
import * as fs from 'fs';

const code = 'function test() { return 1; }';
const c = new Compiler('TGE10');

// Check the opcode value for CallFuncResolve
const callFuncResolveValue = (c as any).getOpcodeValue(OpCode.CallFuncResolve);
const callFuncValue = (c as any).getOpcodeValue(OpCode.CallFunc);
const jmpIffNotValue = (c as any).getOpcodeValue(OpCode.JmpIffNot);

console.log('CallFuncResolve opcode value:', callFuncResolveValue);
console.log('CallFunc opcode value:', callFuncValue);
console.log('JmpIffNot opcode value:', jmpIffNotValue);

// Now compile and check the bytecode
const b = c.compile(code);
const view = new DataView(b.buffer);

// Parse header
let pos = 0;
const version = view.getUint32(pos, true); pos += 4;
const globalStrLen = view.getUint32(pos, true); pos += 4;
pos += globalStrLen;
const globalFloatCount = view.getUint32(pos, true); pos += 4;
pos += globalFloatCount * 8;
const funcStrLen = view.getUint32(pos, true); pos += 4;
pos += funcStrLen;
const funcFloatCount = view.getUint32(pos, true); pos += 4;
pos += funcFloatCount * 8;
const codeSize = view.getUint32(pos, true); pos += 4;
const lineBreaks = view.getUint32(pos, true); pos += 4;

console.log('\ncodeSize:', codeSize);
console.log('First 5 opcodes:');
for (let i = 0; i < 5; i++) {
  const byte = view.getUint8(pos + i);
  console.log('  [' + i + '] = ' + byte);
}
