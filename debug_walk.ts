import { Compiler } from './src/compiler/index';
import { FileLoader, Opcode, OpcodeTag, Ops } from './src/decompiler';
import * as fs from 'fs';

const ops = new Ops();
const T = OpcodeTag;

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

// Walk through instructions from the beginning
let ip = 0;
let count = 0;
const dataFieldCounts: Map<OpcodeTag, number> = new Map();

while (ip < data.code.length && count < 50) {
  const val = data.code[ip];
  const op = Opcode.create(val, ops);
  if (!op) {
    console.log('\nINVALID at ip=' + ip + ' val=' + val);
    console.log('Previous 5 opcodes:', Array.from(data.code.slice(Math.max(0, ip-5), ip)));
    break;
  }
  
  const tag = op.tag;
  
  // Determine expected data count based on the decompiler's buildInstruction
  let dataCount = 0;
  if (tag === T.OP_FUNC_DECL) {
    // name, ns, pkg, hasBody, endAddress, argc + args
    dataCount = 6 + data.code[ip + 6];
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
  } else if (tag === T.OP_STR_TO_UINT || tag === T.OP_STR_TO_FLT || tag === T.OP_STR_TO_NONE ||
             tag === T.OP_FLT_TO_UINT || tag === T.OP_FLT_TO_STR || tag === T.OP_FLT_TO_NONE ||
             tag === T.OP_UINT_TO_FLT || tag === T.OP_UINT_TO_STR || tag === T.OP_UINT_TO_NONE ||
             tag === T.OP_CMPGR || tag === T.OP_CMPGE || tag === T.OP_CMPLT || tag === T.OP_CMPLE ||
             tag === T.OP_CMPNE || tag === T.OP_CMPEQ || tag === T.OP_NOT || tag === T.OP_NOTF ||
             tag === T.OP_ONESCOMPLEMENT || tag === T.OP_SHR || tag === T.OP_SHL ||
             tag === T.OP_AND || tag === T.OP_OR || tag === T.OP_XOR || tag === T.OP_MOD ||
             tag === T.OP_BITAND || tag === T.OP_BITOR || tag === T.OP_NEG ||
             tag === T.OP_ADD || tag === T.OP_SUB || tag === T.OP_MUL || tag === T.OP_DIV) {
    dataCount = 0; // Binary instructions read their operands from the stack, not from the code stream
  } else if (tag === T.OP_TERMINATE_REWIND_STR || tag === T.OP_REWIND_STR ||
             tag === T.OP_ADVANCE_STR || tag === T.OP_ADVANCE_STR_COMMA ||
             tag === T.OP_ADVANCE_STR_NUL || tag === T.OP_COMPARE_STR ||
             tag === T.OP_PUSH || tag === T.OP_PUSH_FRAME || tag === T.OP_BREAK ||
             tag === T.OP_RETURN) {
    dataCount = 0;
  } else {
    dataCount = 0;
  }
  
  // Track data counts
  const key = tag;
  if (!dataFieldCounts.has(key)) {
    dataFieldCounts.set(key, dataCount);
  }
  
  console.log('ip=' + ip + ' opcode=' + val + ' tag=' + tag + ' dataCount=' + dataCount);
  ip += 1 + dataCount;
  count++;
}
