import { Compiler } from './src/compiler/index';

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');

const view = new DataView(b.buffer);
let pos = 0;
const version = view.getUint32(pos, true); pos += 4;
console.log('version:', version);

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
console.log('Buffer length:', b.length);

// Read opcodes
console.log('\nOpcodes:');
for (let i = 0; i < codeSize; i++) {
  const byte = view.getUint8(pos);
  pos++;
  if (byte === 0xFF) {
    const val = view.getUint32(pos, true);
    pos += 4;
    console.log('  [' + i + '] EXTENDED: ' + byte + ' -> ' + val);
  } else {
    console.log('  [' + i + '] ' + byte);
  }
}
