import { Opcode, Ops, OpcodeTag } from './src/decompiler';

const ops = new Ops();
const T = OpcodeTag;

// Check what opcode 70 maps to
const op70 = Opcode.create(70, ops);
console.log('Opcode 70:', op70 ? 'valid, tag=' + op70.tag : 'INVALID');
console.log('OP_CALLFUNC:', T.OP_CALLFUNC);
console.log('OP_CALLFUNC_RESOLVE:', T.OP_CALLFUNC_RESOLVE);
console.log('Tag 69:', T[69]);

// Check if tag matches
if (op70) {
  console.log('\nTag matches OP_CALLFUNC?', op70.tag === T.OP_CALLFUNC);
  console.log('Tag matches OP_CALLFUNC_RESOLVE?', op70.tag === T.OP_CALLFUNC_RESOLVE);
}

// Check all valid opcodes 65-75
console.log('\nOpcodes 65-75:');
for (let i = 65; i <= 75; i++) {
  const op = Opcode.create(i, ops);
  console.log('  ' + i + ': ' + (op ? 'valid, tag=' + op.tag : 'INVALID'));
}
