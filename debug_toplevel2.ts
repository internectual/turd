import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

// Patch compileBlock to track ip in both passes
let countingTopLevelIp = -1;
let emitTopLevelIp = -1;
let topLevelCallCount = 0;

const origCompileBlock = (c as any).compileBlock;
(c as any).compileBlock = function(context: any, stmts: any) {
  const before = context.ip;
  const result = origCompileBlock.call(this, context, stmts);
  const after = context.ip;
  
  // Track the first top-level call (not nested inside compileFunction)
  if (!this.inFunction) {
    topLevelCallCount++;
    if (topLevelCallCount === 1) {
      if (this.counting) {
        countingTopLevelIp = after;
        console.log('Counting top-level: ip=' + after + ' stmts=' + stmts.length);
      } else {
        emitTopLevelIp = after;
        console.log('Emit top-level: ip=' + after + ' stmts=' + stmts.length);
      }
    }
  }
  return result;
};

const b = c.compile(code);
console.log('Counting top-level ip:', countingTopLevelIp);
console.log('Emit top-level ip:', emitTopLevelIp);
console.log('Match:', countingTopLevelIp === emitTopLevelIp);
