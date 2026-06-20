import { Compiler } from './src/compiler/index';
import { FileLoader, decompile } from './src/decompiler';

const code = 'function test() { return 1; }';
const c = new Compiler('TGE10');
const b = c.compile(code);
const data = new FileLoader().load(b);

console.log('codeSize:', data.code.length);
console.log('Opcodes:', Array.from(data.code));
console.log('Identifier table:', Array.from(data.identifierTable.entries()));
console.log('Global string table:');
for (const [offset, entry] of data.globalStringTable.entries) {
  console.log('  offset=' + offset + ' string="' + entry.string + '"');
}
console.log('Function string table:');
for (const [offset, entry] of data.functionStringTable.entries) {
  console.log('  offset=' + offset + ' string="' + entry.string + '"');
}

try {
  const r = decompile(b);
  console.log('Decompile:', r.ok ? 'PASS' : 'FAIL: ' + r.error);
  if (r.ok) console.log(r.source);
} catch (e: any) {
  console.log('Decompile error:', e.message);
  console.log('Stack:', e.stack?.split('\n').slice(0, 5).join('\n'));
}
