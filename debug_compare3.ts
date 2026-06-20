import { Compiler } from './src/compiler/index';
import { FileLoader, Opcode, Ops, OpcodeTag } from './src/decompiler';
import * as fs from 'fs';

const ops = new Ops();
const T = OpcodeTag;

// Our bytecode
const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

// Real DSO
const realDso = fs.readFileSync('/home/methodown/Downloads/mechina/herc_scripts/console_end.cs.dso');
const realData = new FileLoader().load(new Uint8Array(realDso));

console.log('Our bytecode (first 20):');
for (let i = 0; i < 20; i++) {
  const val = data.code[i];
  const op = Opcode.create(val, ops);
  console.log('  [' + i + '] = ' + val + (op ? ' (tag=' + op.tag + ')' : ' INVALID'));
}

console.log('\nReal DSO (first 20):');
for (let i = 0; i < 20; i++) {
  const val = realData.code[i];
  const op = Opcode.create(val, ops);
  console.log('  [' + i + '] = ' + val + (op ? ' (tag=' + op.tag + ')' : ' INVALID'));
}

// Walk through both and find the first difference
console.log('\nWalking through both...');
let ourIp = 0;
let realIp = 0;
let count = 0;
while (ourIp < data.code.length && realIp < realData.code.length && count < 50) {
  const ourVal = data.code[ourIp];
  const realVal = realData.code[realIp];
  
  if (ourVal !== realVal) {
    console.log('DIFF at step ' + count + ': ourIp=' + ourIp + ' realIp=' + realIp + ' ourVal=' + ourVal + ' realVal=' + realVal);
    break;
  }
  
  // Advance based on opcode
  const ourOp = Opcode.create(ourVal, ops);
  if (!ourOp) {
    console.log('INVALID at ourIp=' + ourIp + ' val=' + ourVal);
    break;
  }
  
  const tag = ourOp.tag;
  let dataCount = 0;
  if (tag === T.OP_FUNC_DECL) {
    dataCount = 6 + data.code[ourIp + 6];
  } else if (tag === T.OP_CREATE_OBJECT) {
    dataCount = 3;
  } else if (tag === T.OP_ADD_OBJECT || tag === T.OP_END_OBJECT) {
    dataCount = 1;
  } else if (tag === T.OP_JMP || tag === T.OP_JMPIF || tag === T.OP_JMPIFF || 
             tag === T.OP_JMPIFNOT || tag === T.OP_JMPIFFNOT || 
             tag === T.OP_JMPIF_NP || tag === T.OP_JMPIFNOT_NP) {
    dataCount = 1;
  } else if (tag === T.OP_CALLFUNC || tag === T.OP_CALLFUNC_RESOLVE) {
    dataCount = 3;
  } else if (tag === T.OP_LOADIMMED_IDENT || tag === T.OP_LOADIMMED_STR || 
             tag === T.OP_TAG_TO_STR || tag === T.OP_SETCURVAR || 
             tag === T.OP_SETCURVAR_CREATE || tag === T.OP_SETCURFIELD ||
             tag === T.OP_ADVANCE_STR_APPENDCHAR || tag === T.OP_LOADIMMED_FLT ||
             tag === T.OP_LOADIMMED_UINT) {
    dataCount = 1;
  }
  
  ourIp += 1 + dataCount;
  realIp += 1 + dataCount;
  count++;
}
