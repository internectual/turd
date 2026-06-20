import { Compiler } from './src/compiler/index';
import { FileLoader, Opcode, OpcodeTag, Ops, decompile } from './src/decompiler';
import * as fs from 'fs';

const ops = new Ops();

// Simple test first
const code1 = 'function test() { return 1; }';
const c1 = new Compiler('TGE10');
const b1 = c1.compile(code1);
const data1 = new FileLoader().load(new Uint8Array(b1));

console.log('=== SIMPLE TEST ===');
console.log('codeSize:', data1.code.length);
console.log('All opcodes:', Array.from(data1.code));

const r1 = decompile(new Uint8Array(b1));
console.log('Decompile:', r1.ok ? 'PASS' : 'FAIL: ' + r1.error);
if (r1.ok) console.log(r1.source);

// Now console_start.cs
console.log('\n=== CONSOLE_START.CS ===');
const code2 = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c2 = new Compiler('TGE10');
const b2 = c2.compile(code2);
const data2 = new FileLoader().load(new Uint8Array(b2));

console.log('codeSize:', data2.code.length);

// Walk through instructions manually
let ip = 0;
let count = 0;
const T = OpcodeTag;
while (ip < data2.code.length && count < 30) {
  const val = data2.code[ip];
  const op = Opcode.create(val, ops);
  if (!op) {
    console.log('\nINVALID at ip=' + ip + ' val=' + val);
    console.log('Previous 10:', Array.from(data2.code.slice(Math.max(0, ip-10), ip)));
    console.log('Next 5:', Array.from(data2.code.slice(ip+1, Math.min(data2.code.length, ip+6))));
    break;
  }
  
  // Advance ip based on instruction type (matching decompiler's buildInstruction)
  const tag = op.tag;
  let dataCount = 0;
  if (tag === T.OP_FUNC_DECL) {
    dataCount = 6 + data2.code[ip + 6]; // name, ns, pkg, hasBody, endAddress, argc + args
  } else if (tag === T.OP_CREATE_OBJECT) {
    dataCount = 3; // parent, datablock, failJump
  } else if (tag === T.OP_ADD_OBJECT || tag === T.OP_END_OBJECT) {
    dataCount = 1; // root
  } else if (tag === T.OP_JMP || tag === T.OP_JMPIF || tag === T.OP_JMPIFF || 
             tag === T.OP_JMPIFNOT || tag === T.OP_JMPIFFNOT || 
             tag === T.OP_JMPIF_NP || tag === T.OP_JMPIFNOT_NP) {
    dataCount = 1; // target
  } else if (tag === T.OP_CALLFUNC || tag === T.OP_CALLFUNC_RESOLVE) {
    dataCount = 3; // name, ns, callType
  } else if (tag === T.OP_LOADIMMED_IDENT || tag === T.OP_LOADIMMED_STR || 
             tag === T.OP_TAG_TO_STR || tag === T.OP_SETCURVAR || 
             tag === T.OP_SETCURVAR_CREATE || tag === T.OP_SETCURFIELD ||
             tag === T.OP_ADVANCE_STR_APPENDCHAR) {
    dataCount = 1;
  }
  
  console.log('ip=' + ip + ' opcode=' + val + ' tag=' + tag + ' dataCount=' + dataCount);
  ip += 1 + dataCount;
  count++;
}

if (count >= 30) {
  console.log('First 30 instructions all valid');
}
