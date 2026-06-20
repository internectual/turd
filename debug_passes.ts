import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

// Monkey-patch to debug
const origCompileBlock = (c as any).compileBlock.bind(c);
let passCount = 0;

(c as any).compileBlock = function(context: any, stmts: any) {
  passCount++;
  const beforeIp = context.ip;
  const beforeBreakCount = (c as any).breakLineCount;
  const result = origCompileBlock(context, stmts);
  const afterIp = context.ip;
  const afterBreakCount = (c as any).breakLineCount;
  if (passCount <= 5) {
    console.log(`Pass ${passCount}: ip ${beforeIp}->${afterIp}, breakCount ${beforeBreakCount}->${afterBreakCount}, stmts=${stmts.length}`);
  }
  return result;
};

const b = c.compile(code);
console.log(`Bytecode length: ${b.length}`);
console.log(`Total passes: ${passCount}`);
