import { Compiler } from './src/compiler/index';
import { disassembleText } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);

const result = disassembleText(new Uint8Array(b));
if (result.ok) {
  console.log(result.text?.substring(0, 2000));
} else {
  console.log('FAIL:', result.error);
}
