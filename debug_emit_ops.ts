import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

let countingBreakCount = -1;
let emitBreakCount = -1;

// Monkey-patch compileAST to capture breakCount from both passes
const origCompileAST = (c as any).compileAST.bind(c);
(c as any).compileAST = function(stmts: any) {
  // Patch addBreakLine to track when counting is true vs false
  const origAddBreakLine = (c as any).addBreakLine.bind(c);
  let lastCounting = false;
  
  (c as any).addBreakLine = function(context: any, lineNo: number) {
    const wasCounting = lastCounting;
    lastCounting = (c as any).counting;
    return origAddBreakLine(context, lineNo);
  };
  
  // Patch emit to track pass
  const origEmit = (c as any).emit.bind(c);
  let emittedOps = 0;
  (c as any).emit = function(context: any, ...ops: number[]) {
    if (!(c as any).counting) {
      emittedOps += ops.length;
    }
    return origEmit(context, ...ops);
  };
  
  const result = origCompileAST(stmts);
  console.log('Emitted ops (excluding counting):', emittedOps);
  console.log('Bytecode length:', result.length);
  console.log('Match:', emittedOps === result.length);
  
  return result;
};

const b = c.compile(code);
