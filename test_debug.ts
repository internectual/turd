import { Compiler } from './src/compiler/index';
import { decompile } from './src/decompiler';

const code = 'function test() { return 1; }';
const c = new Compiler('TGE10');
const b = c.compile(code);
console.log('Bytecode length:', b.length);

// Parse the header
const view = new DataView(b.buffer);
let pos = 0;
const version = view.getUint32(pos, true); pos += 4;
const globalStrLen = view.getUint32(pos, true); pos += 4;
console.log('globalStrLen:', globalStrLen);
pos += globalStrLen;
const globalFloatCount = view.getUint32(pos, true); pos += 4;
console.log('globalFloatCount:', globalFloatCount);
pos += globalFloatCount * 8;
const funcStrLen = view.getUint32(pos, true); pos += 4;
console.log('funcStrLen:', funcStrLen);
pos += funcStrLen;
const funcFloatCount = view.getUint32(pos, true); pos += 4;
console.log('funcFloatCount:', funcFloatCount);
pos += funcFloatCount * 8;
const codeSize = view.getUint32(pos, true); pos += 4;
console.log('codeSize:', codeSize);
const lineBreaks = view.getUint32(pos, true); pos += 4;
console.log('lineBreaks:', lineBreaks);
console.log('Header ends at byte:', pos);

// Try to read the code stream
try {
  const opcodes = [];
  for (let i = 0; i < codeSize; i++) {
    const byte = view.getUint8(pos);
    pos++;
    if (byte === 0xFF) {
      const val = view.getUint32(pos, true);
      pos += 4;
      opcodes.push(val);
    } else {
      opcodes.push(byte);
    }
  }
  console.log('Opcodes:', opcodes);
} catch (e: any) {
  console.log('Error reading opcodes:', e.message);
  console.log('Failed at byte:', pos, 'buffer size:', b.length);
}
