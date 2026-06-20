import { Compiler } from './src/compiler/index';
import { FileLoader, Opcode, Ops, OpcodeTag } from './decompiler';
import * as fs from 'fs';

const ops = new Ops();
const T = OpcodeTag;

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

let ip = 0;
while (ip < data.code.length) {
  const val = data.code[ip];
  const op = Opcode.create(val, ops);
  if (!op) break;
  
  const tag = op.tag;
  let dataCount = 0;
  if (tag === T.OP_FUNC_DECL) {
    const argc = data.code[ip + 6];
    const endAddr = data.code[ip + 5];
    dataCount = 6 + argc;
    if (ip <= 5706 && ip + dataCount > 5706) {
      console.log('FuncDecl at ip=' + ip + ' endAddr=' + endAddr + ' argc=' + argc);
    }
  } else if (tag === T.OP_JMP || tag === T.OP_JMPIF || tag === T.OP_JMPIFF || 
             tag === T.OP_JMPIFNOT || tag === T.OP_JMPIFFNOT || 
             tag === T.OP_JMPIF_NP || tag === T.OP_JMPIFNOT_NP) {
    dataCount = 1;
    if (ip === 5706) {
      console.log('Branch at ip=' + ip + ' target=' + data.code[ip + 1]);
    }
  } else if (tag === T.OP_CREATE_OBJECT) {
    dataCount = 3;
  } else if (tag === T.OP_ADD_OBJECT || tag === T.OP_END_OBJECT) {
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
  
  ip += 1 + dataCount;
}
