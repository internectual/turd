import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

// Monkey-patch addBreakLine to log
const origAddBreakLine = (c as any).addBreakLine.bind(c);
let countingBreakLines: number[] = [];
let emitBreakLines: number[] = [];
let isCounting = false;

(c as any).addBreakLine = function(context: any, lineNo: number) {
  if (isCounting) {
    countingBreakLines.push(lineNo);
  } else {
    emitBreakLines.push(lineNo);
  }
  return origAddBreakLine(context, lineNo);
};

// Monkey-patch compileAST to track counting vs emit
const origCompileAST = (c as any).compileAST.bind(c);
(c as any).compileAST = function(stmts: any) {
  // Pass 1
  isCounting = true;
  countingBreakLines = [];
  const result = origCompileAST(stmts);
  
  console.log('Counting pass breakLineCount:', countingBreakLines.length);
  console.log('Emit pass breakLineCount:', emitBreakLines.length);
  console.log('Match:', countingBreakLines.length === emitBreakLines.length);
  
  if (countingBreakLines.length !== emitBreakLines.length) {
    console.log('Counting break lines:', countingBreakLines.slice(0, 10));
    console.log('Emit break lines:', emitBreakLines.slice(0, 10));
  }
  
  return result;
};

const b = c.compile(code);
console.log('Bytecode length:', b.length);
