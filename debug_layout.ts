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

// Walk through instructions and show the layout
let ip = 0;
let count = 0;
while (ip < data.code.length && count < 50) {
  const val = data.code[ip];
  const op = Opcode.create(val, ops);
  if (!op) {
    console.log('\nINVALID at ip=' + ip + ' val=' + val);
    break;
  }
  
  const tag = op.tag;
  let dataCount = 0;
  if (tag === T.OP_FUNC_DECL) {
    const argc = data.code[ip + 6];
    dataCount = 6 + argc;
    console.log('ip=' + ip + ' FuncDecl argc=' + argc + ' dataCount=' + dataCount + ' endAddr=' + data.code[ip + 5]);
  } else if (tag === T.OP_CREATE_OBJECT) {
    dataCount = 3;
    console.log('ip=' + ip + ' CreateObject dataCount=' + dataCount);
  } else if (tag === T.OP_ADD_OBJECT || tag === T.OP_END_OBJECT) {
    dataCount = 1;
    console.log('ip=' + ip + ' AddObject/EndObject dataCount=' + dataCount);
  } else if (tag === T.OP_JMP || tag === T.OP_JMPIF || tag === T.OP_JMPIFF || 
             tag === T.OP_JMPIFNOT || tag === T.OP_JMPIFFNOT || 
             tag === T.OP_JMPIF_NP || tag === T.OP_JMPIFNOT_NP) {
    dataCount = 1;
    const target = data.code[ip + 1];
    console.log('ip=' + ip + ' Branch target=' + target);
  } else if (tag === T.OP_CALLFUNC || tag === T.OP_CALLFUNC_RESOLVE) {
    dataCount = 3;
    console.log('ip=' + ip + ' CallFunc dataCount=' + dataCount);
  } else if (tag === T.OP_LOADIMMED_IDENT || tag === T.OP_LOADIMMED_STR || 
             tag === T.OP_TAG_TO_STR || tag === T.OP_SETCURVAR || 
             tag === T.OP_SETCURVAR_CREATE || tag === T.OP_SETCURFIELD ||
             tag === T.OP_ADVANCE_STR_APPENDCHAR || tag === T.OP_LOADIMMED_FLT ||
             tag === T.OP_LOADIMMED_UINT || tag === T.OP_SETCURVAR_ARRAY ||
             tag === T.OP_SETCURVAR_ARRAY_CREATE || tag === T.OP_SETCURFIELD_ARRAY) {
    dataCount = 1;
    console.log('ip=' + ip + ' tag=' + tag + ' dataCount=' + dataCount);
  } else {
    console.log('ip=' + ip + ' tag=' + tag + ' dataCount=0');
  }
  
  ip += 1 + dataCount;
  count++;
}
