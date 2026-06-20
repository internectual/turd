import { Compiler } from './src/compiler/index';
import { decompile } from './src/decompiler';
import * as fs from 'fs';

// Compare headers
const realFile = fs.readFileSync('/home/methodown/Downloads/mechina/herc_scripts/' + fs.readdirSync('/home/methodown/Downloads/mechina/herc_scripts/').filter(f => f.endsWith('.dso'))[0]);
const c = new Compiler('TGE10');
const compiled = c.compile('function test() { return 1; }');

function parseHeader(buf: Uint8Array) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let pos = 0;
  const version = view.getUint32(pos, true); pos += 4;
  const globalStrLen = view.getUint32(pos, true); pos += 4;
  const globalStrTable: string[] = [];
  for (let i = 0; i < globalStrLen; i++) {
    globalStrTable.push(String.fromCharCode(view.getUint8(pos + i)));
  }
  pos += globalStrLen;
  const globalFloatCount = view.getUint32(pos, true); pos += 4;
  pos += globalFloatCount * 8;
  const funcStrLen = view.getUint32(pos, true); pos += 4;
  const funcStrTable: string[] = [];
  for (let i = 0; i < funcStrLen; i++) {
    funcStrTable.push(String.fromCharCode(view.getUint8(pos + i)));
  }
  pos += funcStrLen;
  const funcFloatCount = view.getUint32(pos, true); pos += 4;
  pos += funcFloatCount * 8;
  const codeSize = view.getUint32(pos, true); pos += 4;
  const lineBreaks = view.getUint32(pos, true); pos += 4;
  
  return { version, globalStrLen, globalStrTable, globalFloatCount, funcStrLen, funcStrTable, funcFloatCount, codeSize, lineBreaks, headerEnd: pos };
}

const realHeader = parseHeader(new Uint8Array(realFile));
const compiledHeader = parseHeader(compiled);

console.log('Real DSO header:');
console.log('  version:', realHeader.version);
console.log('  globalStrLen:', realHeader.globalStrLen);
console.log('  globalFloatCount:', realHeader.globalFloatCount);
console.log('  funcStrLen:', realHeader.funcStrLen);
console.log('  funcFloatCount:', realHeader.funcFloatCount);
console.log('  codeSize:', realHeader.codeSize);
console.log('  lineBreaks:', realHeader.lineBreaks);
console.log('  headerEnd:', realHeader.headerEnd);

console.log('\nCompiled header:');
console.log('  version:', compiledHeader.version);
console.log('  globalStrLen:', compiledHeader.globalStrLen);
console.log('  globalFloatCount:', compiledHeader.globalFloatCount);
console.log('  funcStrLen:', compiledHeader.funcStrLen);
console.log('  funcFloatCount:', compiledHeader.funcFloatCount);
console.log('  codeSize:', compiledHeader.codeSize);
console.log('  lineBreaks:', compiledHeader.lineBreaks);
console.log('  headerEnd:', compiledHeader.headerEnd);
