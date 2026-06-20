import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

// Monkey-patch to compare counting pass vs emit pass
const origEmit = Compiler.prototype.emit;
const origContextIp = Compiler.prototype.context_ip;

let countingLog: number[] = [];
let emitLog: number[] = [];
let passNumber = 0;

Compiler.prototype.emit = function(context: any, ...ops: number[]) {
  if (context && context.ip >= 250 && context.ip <= 260) {
    if (passNumber === 1) countingLog.push(context.ip);
    else if (passNumber === 2) emitLog.push(context.ip);
  }
  return origEmit.call(this, context, ...ops);
};

// Patch compileAST to track passes
const origCompileAST = Compiler.prototype.compileAST;
Compiler.prototype.compileAST = function(stmts: any) {
  passNumber = 1;
  countingLog = [];
  const result = origCompileAST.call(this, stmts);
  passNumber = 2;
  emitLog = [];
  return result;
};

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);

console.log('Counting pass emit positions (250-260):', countingLog);
console.log('Emit pass emit positions (250-260):', emitLog);
console.log('Match:', JSON.stringify(countingLog) === JSON.stringify(emitLog));
