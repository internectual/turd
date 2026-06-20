import { Compiler } from './src/compiler/index';
const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');
console.log('Bytes 60-71:', Array.from(b.slice(60, 71)));
const v = new DataView(b.buffer);
const count = v.getUint32(63, true);
console.log('Ident count:', count);
if (count > 0) {
  const idx = v.getUint32(67, true);
  const cnt = v.getUint32(71, true);
  console.log('strIdx:', idx, 'posCount:', cnt);
}
