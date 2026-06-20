import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

// Monkey-patch identTable.add to log
const origAdd = (require('./src/compiler/compiler-types').IdentTable.prototype as any).add;
(require('./src/compiler/compiler-types').IdentTable.prototype as any) = function(strTable: any, ident: string, ip: number) {
  const result = origAdd.call(this, strTable, ident, ip);
  console.log(`identTable.add: ident="${ident}" ip=${ip} strTable.entries.length=${strTable.entries.length} identMap.size=${this.identMap.size}`);
  return result;
};

const c = new Compiler('TGE10');
const b = c.compile('function test() { return 1; }');
console.log('Bytecode length:', b.length);
