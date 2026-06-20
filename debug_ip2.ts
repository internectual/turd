import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

let countingIp = -1;
let emitIp = -1;

// Patch the instance method
const origCompileBlock = c.compileBlock.bind(c);
c.compileBlock = function(context: any, stmts: any) {
  const before = context.ip;
  const result = origCompileBlock(context, stmts);
  const after = context.ip;
  
  // Track when we're at the top level (not inside a function)
  if (!this.inFunction) {
    if (this.counting) {
      countingIp = after;
    } else {
      emitIp = after;
    }
  }
  return result;
};

const b = c.compile(code);
console.log('Counting top-level ip:', countingIp);
console.log('Emit top-level ip:', emitIp);
console.log('Match:', countingIp === emitIp);
