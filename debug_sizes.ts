import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

let countingCodeSize = 0;
let emitCodeSize = 0;

// Monkey-patch compileAST
const origCompileAST = (c as any).compileAST.bind(c);
(c as any).compileAST = function(stmts: any) {
  // Intercept the serialize call
  const origSerialize = (c as any).serialize.bind(c);
  (c as any).serialize = function(context: any, codeSize: number, breakCount: number) {
    if ((c as any).counting) {
      countingCodeSize = codeSize;
    } else {
      emitCodeSize = codeSize;
    }
    return origSerialize(context, codeSize, breakCount);
  };
  return origCompileAST(stmts);
};

const b = c.compile(code);
console.log('Counting codeSize:', countingCodeSize);
console.log('Emit codeSize:', emitCodeSize);
console.log('Bytecode length:', b.length);
console.log('Match:', countingCodeSize === emitCodeSize);
