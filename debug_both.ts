import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

// Patch compileAST to log
const orig = (c as any).compileAST.bind(c);
(c as any).compileAST = function(stmts: any) {
  // Counting pass
  (c as any).counting = true;
  (c as any).dummyCtx = { codeStream: [], lineBreakPairs: new Array(10000).fill(0), ip: 0, continuePoint: 0, breakPoint: 0 };
  (c as any).compileBlock((c as any).dummyCtx, stmts);
  console.log('After counting: dummyCtx.ip=' + (c as any).dummyCtx.ip + ' breakCount=' + (c as any).breakLineCount);
  
  const codeSize = (c as any).dummyCtx.ip + 1;
  const breakCount = (c as any).breakLineCount;
  const lineBreakPairCount = breakCount * 2;
  console.log('codeSize=' + codeSize + ' breakCount=' + breakCount + ' lineBreakPairCount=' + lineBreakPairCount);
  
  // Emit pass
  (c as any).counting = false;
  const { CompileContext } = require('./src/compiler/compiler-types');
  const context = new CompileContext(codeSize, lineBreakPairCount);
  (c as any).breakLineCount = 0;
  if (stmts.length > 0) (c as any).compileBlock(context, stmts);
  (c as any).emit(context, (c as any).getOpcodeValue(13));
  console.log('After emit: context.ip=' + context.ip + ' breakCount=' + (c as any).breakLineCount);
  
  return (c as any).serialize(context, codeSize, breakCount);
};

const b = c.compile(code);
console.log('Bytecode length:', b.length);
