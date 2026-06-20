import { decompile } from './src/decompiler';
import * as fs from 'fs';

const buf = fs.readFileSync('/home/methodown/Downloads/GameGui.cs.dso');
const result = decompile(buf);
console.log('Result:', result.ok ? 'PASS' : 'FAIL: ' + result.error);
if (result.ok) {
  console.log('Source length:', result.source?.length);
  console.log('First 500 chars:', result.source?.substring(0, 500));
}
