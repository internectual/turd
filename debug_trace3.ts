import { Compiler } from './src/compiler/index';
import { FileLoader, Opcode, OpcodeTag, Ops } from './src/decompiler';
import * as fs from 'fs';

const ops = new Ops();
const T = OpcodeTag;

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

console.log('codeSize:', data.code.length);

// Walk through ALL instructions to find the first invalid one
let ip = 0;
let count = 0;
while (ip < data.code.length) {
  const val = data.code[ip];
  const op = Opcode.create(val, ops);
  if (!op) {
    console.log('\nINVALID at ip=' + ip + ' val=' + val);
    console.log('Previous 10 opcodes:', Array.from(data.code.slice(Math.max(0, ip-10), ip)));
    console.log('Next 5 opcodes:', Array.from(data.code.slice(ip+1, Math.min(data.code.length, ip+6))));
    
    // Show context: what was the last valid instruction?
    let prevIp = ip - 1;
    while (prevIp >= 0 && data.code[prevIp] > 83) prevIp--;
    if (prevIp >= 0) {
      console.log('Last valid opcode at ip=' + prevIp + ': val=' + data.code[prevIp]);
      // Show the instruction before that
      let beforePrev = prevIp - 1;
      while (beforePrev >= 0 && data.code[beforePrev] > 83) beforePrev--;
      if (beforePrev >= 0) {
        console.log('Before that at ip=' + beforePrev + ': val=' + data.code[beforePrev]);
      }
    }
    break;
  }
  
  // Advance ip based on instruction type
  const tag = op.tag;
  let dataCount = 0;
  if (tag === T.OP_FUNC_DECL) {
    const argc = data.code[ip + 6];
    dataCount = 6 + argc;
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
             tag === T.OP_LOADIMMED_UINT || tag === T.OP_SETCURVAR_ARRAY ||
             tag === T.OP_SETCURVAR_ARRAY_CREATE || tag === T.OP_SETCURFIELD_ARRAY) {
    dataCount = 1;
  }
  
  ip += 1 + dataCount;
  count++;
}

console.log('Total valid instructions before error:', count);
