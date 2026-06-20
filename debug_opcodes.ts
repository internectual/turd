import { Ops, Opcode } from './src/decompiler';

const ops = new Ops();

// Check if common opcodes are valid
const testValues = [0, 1, 6, 7, 8, 9, 10, 11, 12, 13, 58, 68, 69, 70, 71, 80, 81, 82, 83, 101, 292];
for (const v of testValues) {
  const op = Opcode.create(v, ops);
  console.log('Opcode ' + v + ': ' + (op ? 'VALID (' + op.tag + ')' : 'INVALID'));
}
