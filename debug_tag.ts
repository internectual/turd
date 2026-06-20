import { Opcode, OpcodeTag, Ops } from './src/decompiler';

const ops = new Ops();
const T = OpcodeTag;

// Check opcode 70
const op70 = Opcode.create(70, ops);
console.log('Opcode 70:', op70 ? 'valid, tag=' + op70.tag : 'INVALID');
console.log('OP_CALLFUNC_RESOLVE =', T.OP_CALLFUNC_RESOLVE);
console.log('OP_CALLFUNC =', T.OP_CALLFUNC);
console.log('Tag 69 =', T[69]);

// Check all tags
for (let i = 0; i <= 83; i++) {
  const op = Opcode.create(i, ops);
  if (op && op.tag === T.OP_CALLFUNC_RESOLVE) {
    console.log('CallFuncResolve opcode value:', i);
  }
}
