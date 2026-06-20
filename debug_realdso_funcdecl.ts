import * as fs from 'fs';

const buf = fs.readFileSync('/home/methodown/Downloads/GameGui.cs.dso');
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

// Skip to code start
let pos = 8794;

// Read first 30 bytes of code stream as hex
console.log('Code stream bytes 8794-8830:');
for (let i = 8794; i < 8830; i++) {
  process.stdout.write(buf[i].toString(16).padStart(2, '0') + ' ');
  if ((i - 8794 + 1) % 16 === 0) process.stdout.write('\n');
}
console.log();

// Read first opcode
pos = 8794;
const op = view.getUint8(pos++);
console.log('\nop:', op, '(OP_FUNC_DECL)');

// Read name (u32)
const name = view.getUint32(pos, true);
pos += 4;
console.log('name strIdx:', name);

// Read namespace (u32)
const ns = view.getUint32(pos, true);
pos += 4;
console.log('ns strIdx:', ns);

// Read package (u32)
const pkg = view.getUint32(pos, true);
pos += 4;
console.log('pkg strIdx:', pkg);

// Read hasBody (u8)
const hasBody = view.getUint8(pos++);
console.log('hasBody:', hasBody);

// Read endAddress (u32)
const endAddress = view.getUint32(pos, true);
pos += 4;
console.log('endAddress:', endAddress);

// Read argc (u32)
const argc = view.getUint32(pos, true);
pos += 4;
console.log('argc:', argc);

// Next opcode
const nextOp = view.getUint8(pos++);
console.log('next op:', nextOp);

console.log('\nFuncDecl size: 1 + 4 + 4 + 4 + 1 + 4 + 4 = 22 bytes');
console.log('After FuncDecl, next opcode at byte:', pos);
