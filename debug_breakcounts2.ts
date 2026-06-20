import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

let countingBreakCount = -1;
let emitBreakCount = -1;

// Monkey-patch addBreakLine
const origAddBreakLine = (c as any).addBreakLine.bind(c);
(c as any).addBreakLine = function(context: any, lineNo: number) {
  return origAddBreakLine(context, lineNo);
};

// Monkey-patch compileAST to capture breakCount
const origCompileAST = (c as any).compileAST.bind(c);
(c as any).compileAST = function(stmts: any) {
  // Counting pass
  (c as any).counting = true;
  const dummy: any = { codeStream: [], lineBreakPairs: new Array(10000).fill(0), ip: 0, continuePoint: 0, breakPoint: 0 };
  
  // Intercept breakLineCount after counting pass
  const origCompileBlock = (c as any).compileBlock.bind(c);
  let countingBlockCalled = false;
  (c as any).compileBlock = function(context: any, stmts: any) {
    const result = origCompileBlock(context, stmts);
    if ((c as any).counting && !countingBlockCalled) {
      countingBreakCount = (c as any).breakLineCount;
      countingBlockCalled = true;
    }
    return result;
  };
  
  (c as any).compileBlock(dummy, stmts);
  
  // Emit pass
  (c as any).counting = false;
  (c as any).breakLineCount = 0;
  const { CompileContext } = require('./src/compiler/compiler-types');
  const context = new CompileContext(dummy.ip + 1, countingBreakCount * 2);
  let emitBlockCalled = false;
  (c as any).compileBlock = function(ctx: any, stmts: any) {
    const result = origCompileBlock(ctx, stmts);
    if (!(c as any).counting && !emitBlockCalled) {
      emitBreakCount = (c as any).breakLineCount;
      emitBlockCalled = true;
    }
    return result;
  };
  
  (c as any).compileBlock(context, stmts);
  
  console.log('Counting breakCount:', countingBreakCount);
  console.log('Emit breakCount:', emitBreakCount);
  console.log('Match:', countingBreakCount === emitBreakCount);
  
  // Restore
  (c as any).compileBlock = origCompileBlock;
  
  (c as any).emit(context, (c as any).getOpcodeValue(13)); // Return
  
  return (c as any).serialize(context, dummy.ip + 1, countingBreakCount);
};

const b = c.compile(code);
