import { Opcode, OpcodeTag, Ops } from './src/decompiler';

const ops = new Ops();
const T = OpcodeTag;

const op70 = Opcode.create(70, ops);
console.log('Opcode 70 tag:', op70?.tag);
console.log('OP_CALLFUNC:', T.OP_CALLFUNC);
console.log('OP_CALLFUNC_RESOLVE:', T.OP_CALLFUNC_RESOLVE);
console.log('Tag 69:', T[69]);

// Check if the switch would match
if (op70) {
  const tag = op70.tag;
  console.log('\nSwitch cases:');
  console.log('  tag === OP_CALLFUNC?', tag === T.OP_CALLFUNC);
  console.log('  tag === OP_CALLFUNC_RESOLVE?', tag === T.OP_CALLFUNC_RESOLVE);
}
