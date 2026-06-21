import { Compiler } from '../src/compiler/compiler.ts';
import { decompile } from '../src/decompiler.ts';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

const src = readFileSync('/tmp/vl2build/console_start.cs', 'utf-8');

const targets = [
  'TGE10',
  'TGE14',
  'TCON',
  'Tribes2',
  'ForgettableDungeon',
  'BlocklandV1',
  'BlocklandV20',
  'BlocklandV21',
] as const;

const outDir = '/tmp/vl2build/out';
mkdirSync(outDir, { recursive: true });

// Copy source
writeFileSync(outDir + '/console_start.cs', src);

let allOk = true;

for (const target of targets) {
  try {
    const compiler = new Compiler(target);
    const dso = compiler.compile(src);
    writeFileSync(outDir + '/' + target + '.console_start.cs.dso', Buffer.from(dso));

    // Verify decompile
    const result = decompile(dso, target);
    if (result.ok) {
      console.log(target + ': OK (' + dso.length + ' bytes, decompiled ' + result.source.length + ' chars)');
    } else {
      console.log(target + ': DECOMPILE FAIL - ' + (result.error ?? 'unknown').substring(0, 120));
      allOk = false;
    }
  } catch (e: any) {
    console.log(target + ': COMPILE ERROR - ' + e.message.substring(0, 120));
    allOk = false;
  }
}

// Create VL2 zip archive
const vl2Path = '/home/methodown/dso-web/disco/decomptest.vl2';
execSync(`cd ${outDir} && zip -9 ${vl2Path} *`, { stdio: 'inherit' });

console.log('\nCreated ' + vl2Path);
console.log('Contents:');
execSync(`unzip -l ${vl2Path}`, { stdio: 'inherit' });
