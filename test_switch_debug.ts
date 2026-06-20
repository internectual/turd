// test_switch_debug.ts — Debug switch binary output

import { Compiler } from './src/compiler/index';

const code = `
function describe(%x)
{
  switch (%x)
  {
    case 1:
      return "one";
    case 2:
      return "two";
    default:
      return "other";
  }
}
`;

const compiler = new Compiler('TGE10');
const bytecode = compiler.compile(code);

// Parse the binary manually
const view = new DataView(bytecode.buffer, bytecode.byteOffset, bytecode.byteLength);
let pos = 0;

const readU32 = () => { const v = view.getUint32(pos, true); pos += 4; return v; };
const readStr = () => { const len = readU32(); let s = ''; for (let i = 0; i < len; i++) s += String.fromCharCode(view.getUint8(pos++)); return s; };

console.log(`Total bytes: ${bytecode.length}`);
console.log(`Version: ${readU32()}`);

const globalStrLen = readU32();
console.log(`Global string table length: ${globalStrLen}`);
pos += globalStrLen;

const globalFloatCount = readU32();
console.log(`Global float count: ${globalFloatCount}`);
pos += globalFloatCount * 8;

const funcStrLen = readU32();
console.log(`Function string table length: ${funcStrLen}`);
pos += funcStrLen;

const funcFloatCount = readU32();
console.log(`Function float count: ${funcFloatCount}`);
pos += funcFloatCount * 8;

const codeSize = readU32();
console.log(`Code size: ${codeSize}`);

const lineBreaks = readU32();
console.log(`Line breaks: ${lineBreaks}`);

// Read code
console.log(`Reading ${codeSize} code bytes...`);
for (let i = 0; i < codeSize; i++) {
  if (pos >= bytecode.length) { console.log(`  OVERFLOW at code byte ${i}`); break; }
  let op = view.getUint8(pos++);
  if (op === 0xFF) { op = readU32(); }
}

console.log(`After code: pos=${pos}`);

// Read line breaks
console.log(`Reading ${lineBreaks * 2} line break u32s...`);
for (let i = 0; i < lineBreaks * 2; i++) {
  if (pos + 4 > bytecode.length) { console.log(`  OVERFLOW at line break ${i}`); break; }
  readU32();
}

console.log(`After line breaks: pos=${pos}`);

// Read identifier table
if (pos + 4 <= bytecode.length) {
  const idCount = readU32();
  console.log(`Identifier count: ${idCount}`);
  for (let i = 0; i < idCount; i++) {
    if (pos + 8 > bytecode.length) { console.log(`  OVERFLOW at identifier ${i}`); break; }
    const strIdx = readU32();
    const numPos = readU32();
    console.log(`  id[${i}]: strIdx=${strIdx}, numPos=${numPos}`);
    for (let j = 0; j < numPos; j++) {
      if (pos + 4 > bytecode.length) { console.log(`    OVERFLOW at position ${j}`); break; }
      readU32();
    }
  }
}

console.log(`Final pos: ${pos}`);
