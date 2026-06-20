import { Compiler } from './src/compiler/index';
import { FileLoader } from './src/decompiler';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');
const b = c.compile(code);

// Patch FileLoader to track data.code.length changes
const origReadCode = FileLoader.prototype.readCode;
const origReadLineBreaks = FileLoader.prototype.readLineBreaks;
const origReadIdentifierTable = FileLoader.prototype.readIdentifierTable;
const origReadHeader = FileLoader.prototype.readHeader;
const origReadTables = FileLoader.prototype.readTables;
const origReadOp = (FileReader.prototype as any).readOp;
const origReadUInt = (FileReader.prototype as any).readUInt;
const origReadByte = (FileReader.prototype as any).readByte;

(FileReader.prototype as any).readOp = function() {
  const result = origReadOp.call(this);
  if (this._data && this._data.code && this._data.code.length > 15086) {
    console.log('readOp: result=' + result + ' data.code.length=' + this._data.code.length + ' _pos=' + this._pos);
  }
  return result;
};

(FileReader.prototype as any).readUInt = function() {
  const result = origReadUInt.call(this);
  return result;
};

FileLoader.prototype.readHeader = function(data: any) {
  console.log('=== readHeader ===');
  const result = origReadHeader.call(this, data);
  console.log('  version:', result.version);
  return result;
};

FileLoader.prototype.readTables = function(data: any) {
  console.log('=== readTables (before) ===');
  console.log('  reader._pos:', (this.reader as any)._pos);
  origReadTables.call(this, data);
  console.log('=== readTables (after) ===');
  console.log('  reader._pos:', (this.reader as any)._pos);
};

FileLoader.prototype.readCode = function(data: any) {
  console.log('=== readCode (before) ===');
  console.log('  reader._pos:', (this.reader as any)._pos);
  console.log('  data.code.length:', data.code ? data.code.length : 'N/A');
  const result = origReadCode.call(this, data);
  console.log('=== readCode (after) ===');
  console.log('  reader._pos:', (this.reader as any)._pos);
  console.log('  result.size:', result.size, 'result.lineBreaks:', result.lineBreaks);
  console.log('  data.code.length:', data.code.length);
  return result;
};

FileLoader.prototype.readLineBreaks = function(codeSize: any, lineBreaks: any) {
  console.log('=== readLineBreaks (before) ===');
  console.log('  codeSize:', codeSize, 'lineBreaks:', lineBreaks);
  console.log('  reader._pos:', (this.reader as any)._pos);
  console.log('  data.code.length:', this._data ? this._data.code.length : 'N/A');
  origReadLineBreaks.call(this, codeSize, lineBreaks);
  console.log('=== readLineBreaks (after) ===');
  console.log('  reader._pos:', (this.reader as any)._pos);
  console.log('  data.code.length:', this._data ? this._data.code.length : 'N/A');
};

const data = new FileLoader().load(new Uint8Array(b));
console.log('\nFinal data.code.length:', data.code.length);
