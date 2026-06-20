import { decompile } from './src/decompiler';
import * as fs from 'fs';

const realDso = fs.readFileSync('/home/methodown/Downloads/mechina/herc_scripts/scripts/Core.cs.dso');
const r = decompile(realDso);
console.log('Real DSO decompile:', r.ok ? 'PASS' : 'FAIL: ' + r.error);
if (r.ok) console.log(r.source.substring(0, 500));
