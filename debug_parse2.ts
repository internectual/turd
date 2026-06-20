import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');

// Temporarily replace compileAST to capture both passes
const origSource = fs.readFileSync('/home/methodown/dso-web/disco/src/compiler/compiler.ts', 'utf8');

// Just compile and check the header
const c = new Compiler('TGE10');

// Monkey-patch serialize to capture codeSize
const origSerialize = (c as any).serialize.bind(c);
let capturedCodeSize = 0;
let capturedBreakCount = 0;
(c as any).serialize = function(context: any, codeSize: number, breakCount: number) {
  capturedCodeSize = codeSize;
  capturedBreakCount = breakCount;
  return origSerialize(context, codeSize, breakCount);
};

const b = c.compile(code);
console.log('codeSize:', capturedCodeSize);
console.log('breakCount:', capturedBreakCount);
console.log('bytecode length:', b.length);

// Parse header manually
const view = new DataView(b.buffer);
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
const headerCodeSize = view.getUint32(pos, true); pos += 4;
const headerLineBreaks = view.getUint32(pos, true); pos += 4;

console.log('Header codeSize:', headerCodeSize);
console.log('Header lineBreaks:', headerLineBreaks);
console.log('Match codeSize:', capturedCodeSize === headerCodeSize);

// Read opcodes and check for invalid ones
let opcodeCount = 0;
let invalidCount = 0;
let codeEnd = pos;
while (opcodeCount < headerCodeSize && codeEnd < b.length) {
  const byte = view.getUint8(codeEnd);
  codeEnd++;
  if (byte === 0xFF) {
    if (codeEnd + 4 <= b.length) {
      const val = view.getUint32(codeEnd, true);
      codeEnd += 4;
      if (val > 83) invalidCount++;
    }
  } else if (byte > 83) {
    invalidCount++;
  }
  opcodeCount++;
}
console.log('Opcodes read:', opcodeCount);
console.log('Invalid opcodes:', invalidCount);
console.log('Code ends at byte:', codeEnd);

// Check line break pairs
const lbEnd = codeEnd + headerLineBreaks * 2 * 4;
console.log('Line break pairs end at:', lbEnd);
console.log('Buffer length:', b.length);
console.log('Enough data:', lbEnd <= b.length);
