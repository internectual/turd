import { Compiler } from './src/compiler/index';

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');

const view = new DataView(b.buffer);
let pos = 35; // skip header

// Read FuncDecl
const op = view.getUint8(pos++); // OP_FUNC_DECL
const name = view.getUint32(pos++); // name (should be patched to string idx)
const ns = view.getUint32(pos++); // namespace
const pkg = view.getUint32(pos++); // package
const hasBody = view.getUint8(pos++); // hasBody
const endAddress = view.getUint32(pos++); // endAddress
const argc = view.getUint32(pos++); // argc

console.log('FuncDecl:');
console.log('  op:', op);
console.log('  name:', name);
console.log('  ns:', ns);
console.log('  pkg:', pkg);
console.log('  hasBody:', hasBody);
console.log('  endAddress:', endAddress);
console.log('  argc:', argc);

// The function body starts at ip=7
// The function body has: LoadImmedStr(68), stringIdx(5), Return(13) = 3 slots (ip 7-9)
// The final Return is at ip 10
// So endAddress should be 10 (exclusive end)
console.log('\nExpected endAddress: 10 (exclusive, points past last body instruction)');
console.log('Actual endAddress:', endAddress);
console.log('Match:', endAddress === 10);
