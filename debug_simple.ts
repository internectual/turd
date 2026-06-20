import { Compiler } from './src/compiler/index';
import { FileLoader } from './src/decompiler';

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');
console.log('Bytecode length:', b.length);

const loader = new FileLoader();
const data = loader.load(b);
console.log('Decompile:', data.decompile());
