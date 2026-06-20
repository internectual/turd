import { Compiler } from './src/compiler/index';
import { FileLoader, Opcode, Ops, OpcodeTag, BytecodeReader } from './src/decompiler';
import * as fs from 'fs';

const ops = new Ops();
const T = OpcodeTag;

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(new Uint8Array(b));

console.log('data.code.length:', data.code.length);

// Manually walk through instructions
const reader = new BytecodeReader(data, ops);
let count = 0;
while (!reader.isAtEnd && count < 50) {
  const addr = reader.idx;
  const rawVal = reader.readUInt();
  const op = Opcode.create(rawVal, ops);
  
  if (!op) {
    console.log('\nINVALID at addr=' + addr + ' rawVal=' + rawVal);
    console.log('Previous 5 data.code:', Array.from(data.code.slice(Math.max(0, addr-5), addr)));
    console.log('Next 5 data.code:', Array.from(data.code.slice(addr+1, Math.min(data.code.length, addr+6))));
    break;
  }
  
  const tag = op.tag;
  
  // Determine data count based on tag (matching buildInstruction)
  let dataCount = 0;
  if (tag === T.OP_FUNC_DECL) {
    dataCount = 6 + data.code[addr + 6];
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
  
  if (addr >= 245 && addr <= 265) {
    console.log('addr=' + addr + ' opcode=' + rawVal + ' tag=' + tag + ' dataCount=' + dataCount + ' nextAddr=' + (addr + 1 + dataCount));
  }
  
  // Advance past data fields
  for (let i = 0; i < dataCount; i++) {
    if (reader.idx < data.code.length) reader.readUInt();
  }
  
  count++;
}
