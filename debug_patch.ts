import { Compiler } from './src/compiler/index';
import { FileLoader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);

// Monkey-patch FileLoader to log codeSize
const origReadCode = FileLoader.prototype.readCode;
FileLoader.prototype.readCode = function(data: any) {
  const result = origReadCode.call(this, data);
  console.log('readCode: size=' + result.size + ' lineBreaks=' + result.lineBreaks + ' data.code.length=' + data.code.length);
  return result;
};

const origReadLineBreaks = FileLoader.prototype.readLineBreaks;
FileLoader.prototype.readLineBreaks = function(codeSize: any, lineBreaks: any) {
  console.log('readLineBreaks: codeSize=' + codeSize + ' lineBreaks=' + lineBreaks);
  return origReadLineBreaks.call(this, codeSize, lineBreaks);
};

const data = new FileLoader().load(new Uint8Array(b));
console.log('Final data.code.length:', data.code.length);
