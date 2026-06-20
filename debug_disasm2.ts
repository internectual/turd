import { Compiler } from './src/compiler/index';
import { FileLoader, disassemble, Ops, Opcode, OpcodeTag } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);

const loader = new FileLoader();
const data = loader.load(new Uint8Array(b));
const ops = new Ops();

// Manually disassemble with logging
let ip = 0;
let instructionCount = 0;
while (ip < data.code.length) {
  const addr = ip;
  const opVal = data.code[ip++];
  
  const op = Opcode.create(opVal, ops);
  if (!op) {
    console.log('INVALID OPCODE at position ' + addr + ': value=' + opVal);
    console.log('  Previous 5 opcodes: ' + data.code.slice(Math.max(0, addr-5), addr));
    console.log('  Next 5 opcodes: ' + data.code.slice(addr+1, Math.min(data.code.length, addr+6)));
    break;
  }
  
  // Read data fields based on opcode
  const tag = op.tag;
  const T = OpcodeTag;
  
  try {
    switch (tag) {
      case T.OP_FUNC_DECL:
        ip += 6; // name, ns, pkg, hasBody, endAddress, argc
        // Skip args
        ip += data.code[addr + 6]; // argc
        break;
      case T.OP_CREATE_OBJECT:
        ip += 3; // parent, datablock, failJump
        break;
      case T.OP_ADD_OBJECT:
        ip += 1; // root
        break;
      case T.OP_END_OBJECT:
        ip += 1; // root
        break;
      case T.OP_JMP: case T.OP_JMPIF: case T.OP_JMPIFF: case T.OP_JMPIFNOT: case T.OP_JMPIFFNOT: case T.OP_JMPIF_NP: case T.OP_JMPIFNOT_NP:
        ip += 1; // target
        break;
      case T.OP_RETURN:
        break;
      case T.OP_CALLFUNC: case T.OP_CALLFUNC_RESOLVE:
        ip += 3; // name, ns, callType
        break;
      case T.OP_PUSH:
        break;
      case T.OP_PUSH_FRAME:
        break;
      case T.OP_LOADIMMED_IDENT:
        ip += 1;
        break;
      default:
        // Simple instruction with no data fields
        break;
    }
  } catch (e: any) {
    console.log('Error reading data fields at position ' + addr + ' (opcode ' + opVal + '): ' + e.message);
    break;
  }
  
  instructionCount++;
  if (instructionCount > 1000) {
    console.log('Stopped after 1000 instructions');
    break;
  }
}

console.log('Processed ' + instructionCount + ' instructions, ip=' + ip + ', codeSize=' + data.code.length);
