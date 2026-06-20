import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

// Patch compileBlock to track ip in both passes
const origCompileBlock = (c as any).compileBlock;
let countingTopLevelIp = -1;
let emitTopLevelIp = -1;

(c as any).compileBlock = function(context: any, stmts: any) {
  // Only track top-level calls (where stmts has the original AST statements)
  const isTopLevel = stmts.length > 0 && stmts[0] && stmts[0].lineNo === 11; // console_start.cs starts at line 11
  const before = context.ip;
  const result = origCompileBlock.call(this, context, stmts);
  const after = context.ip;
  if (isTopLevel) {
    if (this.counting) {
      countingTopLevelIp = after;
    } else {
      emitTopLevelIp = after;
    }
  }
  return result;
};

const b = c.compile(code);
console.log('Counting top-level ip:', countingTopLevelIp);
console.log('Emit top-level ip:', emitTopLevelIp);
console.log('Match:', countingTopLevelIp === emitTopLevelIp);
