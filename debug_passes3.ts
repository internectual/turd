import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

// Directly patch the prototype
const origCompileBlock = (c as any).compileBlock;
let callCount = 0;

(c as any).compileBlock = function(context: any, stmts: any) {
  callCount++;
  const before = context.ip;
  const result = origCompileBlock.call(this, context, stmts);
  const after = context.ip;
  if (callCount <= 3) {
    console.log(`callCount=${callCount} counting=${this.counting} ip:${before}->${after} stmts=${stmts.length}`);
  }
  return result;
};

const b = c.compile(code);
console.log('Total compileBlock calls:', callCount);
console.log('Bytecode length:', b.length);
