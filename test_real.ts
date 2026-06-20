import { decompile } from './src/decompiler';
import * as fs from 'fs';

// Test with a real DSO file
const realDso = fs.readFileSync('/home/methodown/Downloads/mechina/herc_scripts/console_start.cs.dso');
const r = decompile(realDso);
console.log('Real DSO decompile:', r.ok ? 'PASS' : 'FAIL: ' + r.error);
if (r.ok) console.log(r.source.substring(0, 500));
