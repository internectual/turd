import { Compiler } from './src/compiler/index';

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');
console.log('Bytecode length:', b.length);
console.log('Hex dump:');
for (let i = 0; i < Math.min(b.length, 80); i++) {
  process.stdout.write(b[i].toString(16).padStart(2, '0') + ' ');
  if ((i + 1) % 16 === 0) process.stdout.write('\n');
}
