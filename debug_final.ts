import { Compiler } from './src/compiler/index';
import { FileLoader, Opcode, Ops, OpcodeTag } from './src/decompiler';
import * as fs from 'fs';

const ops = new Ops();
const T = OpcodeTag;

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

console.log('codeSize:', data.code.length);

// Find first invalid opcode
let ip = 0;
let count = 0;
while (ip < data.code.length && count < 200) {
  const val = data.code[ip];
  const op = Opcode.create(val, ops);
  if (!op) {
    console.log('\nINVALID at ip=' + ip + ' val=' + val);
    console.log('Previous 10:', Array.from(data.code.slice(Math.max(0, ip-10), ip)));
    console.log('Next 5:', Array.from(data.code.slice(ip+1, Math.min(data.code.length, ip+6))));
    
    if (data.identifierTable.has(ip)) {
      const strIdx = data.identifierTable.get(ip);
      console.log('In identifier table: strIdx=' + strIdx);
    }
    break;
  }
  
  const tag = op.tag;
  let dataCount = 0;
  if (tag === T.OP_FUNC_DECL) {
    const argc = data.code[ip + 6];
    dataCount = 6 + argc;
  } else if (tag === T.OP_CREATE_OBJECT) dataCount = 3;
  else if (tag === T.OP_ADD_OBJECT || tag === T.OP_END_OBJECT) dataCount = 1;
  else if (tag === T.OP_CALLFUNC || tag === T.OP_CALLFUNC_RESOLVE) dataCount = 3;
  else if ([T.OP_LOADIMMED_IDENT, T.OP_LOADIMMED_STR, T.OP_TAG_TO_STR, T.OP_SETCURVAR, T.OP_SETCURVAR_CREATE, T.OP_SETCURFIELD, T.OP_ADVANCE_STR_APPENDCHAR, T.OP_LOADIMMED_FLT, T.OP_LOADIMMED_UINT].includes(tag)) {
    dataCount = 1;
  } else if ([T.OP_JMP, T.OP_JMPIF, T.OP_JMPIFF, T.OP_JMPIFNOT, T.OP_JMPIFFNOT, T.OP_JMPIF_NP, T.OP_JMPIFNOT_NP].includes(tag)) {
    dataCount = 1;
  }
  
  ip += 1 + dataCount;
  count++;
}
