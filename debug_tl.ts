import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

// Patch compileBlock to track ip in both passes
let countingTopLevelIp = -1;
let emitTopLevelIp = -1;

const orig = (c as any).compileBlock.bind(c);
(c as any).compileBlock = function(context: any, stmts: any) {
  const r = orig(context, stmts);
  if (!this.inFunction) {
    if (this.counting) countingTopLevelIp = context.ip;
    else emitTopLevelIp = context.ip;
  }
  return r;
};

c.compile(code);
console.log('countingTopLevelIp:', countingTopLevelIp);
console.log('emitTopLevelIp:', emitTopLevelIp);
