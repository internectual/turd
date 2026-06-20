import { Compiler } from './src/compiler/index';
import { FileLoader, Opcode, Ops, OpcodeTag } from './src/decompiler';
import * as fs from 'fs';

const ops = new Ops();
const T = OpcodeTag;

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

// Walk through and find all FuncDecls and branches
let ip = 0;
const functions: {start: number, end: number}[] = [];
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
    functions.push({start: ip, end: endAddr});
    if (ip <= 5706 && 5706 < ip + dataCount) {
      console.log('FuncDecl containing 5706: start=' + ip + ' endAddr=' + endAddr + ' argc=' + argc);
    }
  } else if (tag === T.OP_JMP || tag === T.OP_JMPIF || tag === T.OP_JMPIFF || 
             tag === T.OP_JMPIFNOT || tag === T.OP_JMPIFFNOT || 
             tag === T.OP_JMPIF_NP || tag === T.OP_JMPIFNOT_NP) {
    dataCount = 1;
    const target = data.code[ip + 1];
    if (ip >= 5700 && ip <= 5710) {
      console.log('Branch at ip=' + ip + ' target=' + target + ' opcode=' + val);
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

// Find which function contains position 5706
for (const fn of functions) {
  if (fn.start <= 5706 && 5706 < fn.end) {
    console.log('\nFunction containing 5706: start=' + fn.start + ' end=' + fn.end);
    console.log('Branch target 5764 is ' + (5764 > fn.end ? 'OUTSIDE' : 'inside') + ' function');
  }
}
