import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

// Monkey-patch to track breakLineCount in both passes
let countingBreakCount = -1;
let emitBreakCount = -1;
let countingIp = -1;
let emitIp = -1;

const origCompileAST = (c as any).compileAST.bind(c);
(c as any).compileAST = function(stmts: any) {
  // Intercept the counting pass
  const origEmit = (c as any).emit.bind(c);
  (c as any).emit = function(context: any, ...ops: number[]) {
    if ((c as any).counting) {
      // Track ip after counting pass
    }
    return origEmit(context, ...ops);
  };
  
  const result = origCompileAST(stmts);
  
  // After both passes, check the header
  const view = new DataView(result.buffer);
  let pos = 0;
  const version = view.getUint32(pos, true); pos += 4;
  const globalStrLen = view.getUint32(pos, true); pos += 4;
  pos += globalStrLen;
  const globalFloatCount = view.getUint32(pos, true); pos += 4;
  pos += globalFloatCount * 8;
  const funcStrLen = view.getUint32(pos, true); pos += 4;
  pos += funcStrLen;
  const funcFloatCount = view.getUint32(pos, true); pos += 4;
  pos += funcFloatCount * 8;
  const codeSize = view.getUint32(pos, true); pos += 4;
  const lineBreaks = view.getUint32(pos, true); pos += 4;
  
  console.log('Header: codeSize=' + codeSize + ' lineBreaks=' + lineBreaks);
  console.log('Expected line break pairs: ' + (lineBreaks * 2));
  console.log('Available bytes after header: ' + (result.length - pos));
  console.log('Bytes needed for code: ' + codeSize);
  console.log('Bytes needed for line break pairs: ' + (lineBreaks * 2 * 4));
  
  return result;
};

const b = c.compile(code);
console.log('Bytecode length:', b.length);
