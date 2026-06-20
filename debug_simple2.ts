import { Compiler } from './src/compiler/index';
import { FileLoader, decompile } from './src/decompiler';

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');
console.log('Bytecode length:', b.length);

// Try using decompile directly
try {
  const result = decompile(b);
  console.log('Decompile:', result);
} catch (e: any) {
  console.log('Error:', e.message);
}
