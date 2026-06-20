import { Compiler } from './src/compiler/index';

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');
console.log('Bytecode length:', b.length);

const view = new DataView(b.buffer);
let pos = 35; // skip header

// Read FuncDecl
const op = view.getUint8(pos++);
console.log(`ip=0: OP_FUNC_DECL (${op})`);

const name = view.getUint32(pos++);
console.log(`ip=1: name strIdx=${name}`);

const ns = view.getUint32(pos++);
console.log(`ip=2: ns strIdx=${ns}`);

const pkg = view.getUint32(pos++);
console.log(`ip=3: pkg strIdx=${pkg}`);

const hasBody = view.getUint8(pos++);
console.log(`ip=4: hasBody=${hasBody}`);

const endAddress = view.getUint32(pos++);
console.log(`ip=5: endAddress=${endAddress}`);

const argc = view.getUint32(pos++);
console.log(`ip=6: argc=${argc}`);

// Body
const bodyOp = view.getUint8(pos++);
console.log(`ip=7: ${bodyOp}`);

if (bodyOp === 68) { // LoadImmedStr
  const strIdx = view.getUint32(pos++);
  console.log(`ip=8: strIdx=${strIdx}`);
  const retOp = view.getUint8(pos++);
  console.log(`ip=9: OP_RETURN (${retOp})`);
  const finalOp = view.getUint8(pos++);
  console.log(`ip=10: final OP_RETURN (${finalOp})`);
}

console.log('\nExpected: endAddress should point to ip=10 (the final Return)');
console.log('If endAddress=10, the function body includes ip 7-9, and the final Return is ip 10.');
console.log('The decompiler should see the function as: ip 0-5 (header) + ip 6 (argc) + ip 7-9 (body)');
