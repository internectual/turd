import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

// Monkey-patch to compare precompile vs emit counts
const origPrecompile = (Compiler.prototype as any).precompileStmt;
let precompileCount = 0;
let emitCount = 0;
let inPrecompile = false;

(Compiler.prototype as any).precompileStmt = function(stmt: any, loopCount: number) {
  inPrecompile = true;
  const result = origPrecompile.call(this, stmt, loopCount);
  inPrecompile = false;
  return result;
};

const origEmit = (Compiler.prototype as any).emit;
(Compiler.prototype as any).emit = function(context: any, ...ops: number[]) {
  if (!inPrecompile) {
    emitCount += ops.length;
  }
  return origEmit.call(this, context, ...ops);
};

const origPrecompileBlock = (Compiler.prototype as any).precompileBlock;
(Compiler.prototype as any).precompileBlock = function(stmts: any[], loopCount: number) {
  let sum = 0;
  for (const s of stmts) {
    inPrecompile = true;
    sum += origPrecompile.call(this, s, loopCount);
    inPrecompile = false;
  }
  precompileCount = sum;
  return sum;
};

const c = new Compiler('TGE10');
const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const b = c.compile(code);

console.log('Precompile count:', precompileCount);
console.log('Emit count:', emitCount);
console.log('Difference:', emitCount - precompileCount);
