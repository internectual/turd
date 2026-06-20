import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

let passNumber = 0;

const origCompileAST = (c as any).compileAST.bind(c);
(c as any).compileAST = function(stmts: any) {
  passNumber++;
  const isCounting = passNumber === 1;
  
  // Patch compileBlock to capture ip
  const origCompileBlock = (c as any).compileBlock.bind(c);
  (c as any).compileBlock = function(context: any, stmts: any) {
    const before = context.ip;
    const result = origCompileBlock(context, stmts);
    const after = context.ip;
    if (isCounting) {
      console.log('Counting pass: ip ' + before + ' -> ' + after + ' (' + stmts.length + ' stmts)');
    } else {
      console.log('Emit pass: ip ' + before + ' -> ' + after + ' (' + stmts.length + ' stmts)');
    }
    return result;
  };
  
  const result = origCompileAST(stmts);
  return result;
};

const b = c.compile(code);
console.log('Bytecode length:', b.length);
