import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

let countingIp = 0;
let emitIp = 0;

// Monkey-patch compileBlock to track ip
const origCompileBlock = (c as any).compileBlock.bind(c);
(c as any).compileBlock = function(context: any, stmts: any) {
  const before = context.ip;
  const result = origCompileBlock(context, stmts);
  const after = context.ip;
  if ((c as any).counting) {
    countingIp = after;
  } else {
    emitIp = after;
  }
  return result;
};

const b = c.compile(code);
console.log('Counting ip:', countingIp);
console.log('Emit ip:', emitIp);
console.log('Bytecode length:', b.length);
console.log('Match:', countingIp === emitIp);
