import * as fs from 'fs';

// Read the real Tribes 2 DSO file
const buf = fs.readFileSync('/home/methodown/Downloads/GameGui.cs.dso');
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

// Parse header
let pos = 0;
const version = view.getUint32(pos, true); pos += 4;
const globalStrLen = view.getUint32(pos, true); pos += 4;
const globalStrStart = pos;
pos += globalStrLen;
const globalFloatCount = view.getUint32(pos, true); pos += 4;
pos += globalFloatCount * 8;
const funcStrLen = view.getUint32(pos, true); pos += 4;
const funcStrStart = pos;
pos += funcStrLen;
const funcFloatCount = view.getUint32(pos, true); pos += 4;
pos += funcFloatCount * 8;
const codeSize = view.getUint32(pos, true); pos += 4;
const lineBreaks = view.getUint32(pos, true); pos += 4;

console.log('version:', version);
console.log('globalStrLen:', globalStrLen, 'at byte:', globalStrStart);
console.log('funcStrLen:', funcStrLen, 'at byte:', funcStrStart);
console.log('codeSize:', codeSize);
console.log('lineBreaks:', lineBreaks);
console.log('code starts at byte:', pos);

// Read the first function's FuncDecl
const codeStart = pos;
const op = view.getUint8(pos++);
console.log('\nFirst opcode:', op, '(OP_FUNC_DECL=0)');

// The FuncDecl in the real DSO:
// ip+0: OP_FUNC_DECL (1 byte)
// ip+1: name (4 bytes, u32 string index)
// ip+5: namespace (4 bytes, u32 string index)
// ip+9: package (4 bytes, u32 string index)
// ip+13: hasBody (1 byte, bool)
// ip+14: endAddress (4 bytes, u32)
// ip+18: argc (4 bytes, u32)
// ip+22: arg identifiers (argc * 4 bytes)

const name = view.getUint32(pos, true); pos += 4;
const ns = view.getUint32(pos, true); pos += 4;
const pkg = view.getUint32(pos, true); pos += 4;
const hasBody = view.getUint8(pos++);
const endAddress = view.getUint32(pos, true); pos += 4;
const argc = view.getUint32(pos, true); pos += 4;

console.log('name strIdx:', name);
console.log('ns strIdx:', ns);
console.log('pkg strIdx:', pkg);
console.log('hasBody:', hasBody);
console.log('endAddress:', endAddress);
console.log('argc:', argc);

// FuncDecl size = 1 + 4 + 4 + 4 + 1 + 4 + 4 = 22 bytes
// So the next opcode should be at codeStart + 22
const nextOpPos = codeStart + 22;
const nextOp = view.getUint8(nextOpPos);
console.log('\nNext opcode at byte:', nextOpPos, 'value:', nextOp);

// Now let's check the function body
// The function body starts at ip = 7 (after FuncDecl header)
// But the FuncDecl header is 22 bytes = 7 slots (1+4+4+4+1+4+4)
// Wait - each slot is NOT 1 byte. The code stream stores BOTH opcodes and data.
// Opcodes are 1 byte. Data fields (like string indices) are 4 bytes (u32).
// So the FuncDecl is: 1 + 4 + 4 + 4 + 1 + 4 + 4 = 22 bytes = 22 slots? No...

// Actually, in the dso-sharp format, each "slot" in the code stream is stored as:
// - If value <= 255: 1 byte
// - If value > 255: 0xFF + 4 bytes (u32)
// So the code stream is a mix of 1-byte and 5-byte values.

// The FuncDecl has:
// - opcode (0): 1 byte
// - name (string index, can be > 255): 5 bytes (0xFF + u32)
// - ns (string index): 5 bytes
// - pkg (string index): 5 bytes
// - hasBody (0 or 1): 1 byte
// - endAddress (can be > 255): 5 bytes
// - argc (usually small): 1 byte if <= 255

// Let me re-read the code stream properly
pos = codeStart;
console.log('\nReading code stream properly:');
for (let i = 0; i < 30 && i < codeSize; i++) {
  const byte = view.getUint8(pos);
  pos++;
  let val = byte;
  let size = 1;
  if (byte === 0xFF) {
    val = view.getUint32(pos, true);
    pos += 4;
    size = 5;
  }
  console.log(`  [${i}] val=${val} (size=${size})`);
}
