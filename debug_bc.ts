import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

let countingBreakCount = -1;
let emitBreakCount = -1;

// Patch addBreakLine to track
const origAddBreakLine = (c as any).addBreakLine.bind(c);
(c as any).addBreakLine = function(context: any, lineNo: number) {
  const result = origAddBreakLine(context, lineNo);
  if (this.counting) {
    countingBreakCount = this.breakLineCount;
  } else {
    emitBreakCount = this.breakLineCount;
  }
  return result;
};

const b = c.compile(code);
console.log('Counting breakLineCount:', countingBreakCount);
console.log('Emit breakLineCount:', emitBreakCount);
console.log('Match:', countingBreakCount === emitBreakCount);
