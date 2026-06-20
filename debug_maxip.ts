import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

// Monkey-patch to track max IP
const origCompile = (c as any).compileAST.bind(c);
(c as any).compileAST = function(stmts: any) {
  const result = origCompile(stmts);
  console.log('After compile:');
  console.log('  context.ip:', (this as any).context ? (this as any).context.ip : 'N/A');
  console.log('  codeSize:', (this as any).codeSize);
  return result;
};

try {
  const b = c.compile(code);
  console.log('Bytecode length:', b.length);
} catch (e: any) {
  console.log('Error:', e.message);
}
