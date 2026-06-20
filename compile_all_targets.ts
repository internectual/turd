// compile_all_targets.ts — Compile console_start.cs for all targets and create zip
import { Compiler } from './src/compiler/index';
import { decompile } from './src/decompiler';
import * as fs from 'fs';
import * as path from 'path';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const outputDir = '/tmp/decomptest';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const targets = ['TGE10', 'Tribes2', 'TFD'];
const targetPrefixes: Record<string, string> = { TGE10: 'tge10', Tribes2: 'tribes2', TFD: 'tfd' };

let ok = 0, fail = 0;
for (const target of targets) {
  try {
    const compiler = new Compiler(target);
    const bytecode = compiler.compile(code);
    // Append .dso to original filename
    const filename = 'console_start.cs.dso';
    const prefix = targetPrefixes[target];
    const outName = prefix + '.' + filename;
    fs.writeFileSync(path.join(outputDir, outName), Buffer.from(bytecode));
    console.log(outName + ': ' + bytecode.length + ' bytes');
    ok++;
  } catch (e: any) {
    console.log(target + ': ERROR - ' + e.message);
    fail++;
  }
}

// Create zip using Python
const { execSync } = require('child_process');
execSync('python3 -c "import zipfile, os; zf = zipfile.ZipFile(\'/tmp/decomptest.vl2\', \'w\', zipfile.ZIP_DEFLATED); [zf.write(os.path.join(\'/tmp/decomptest\', f), f) for f in sorted(os.listdir(\'/tmp/decomptest\'))]; zf.close()"');

const zipSize = fs.statSync('/tmp/decomptest.vl2').size;
console.log('\nCompiled: ' + ok + ' passed, ' + fail + ' failed');
console.log('Zip: /tmp/decomptest.vl2 (' + zipSize + ' bytes)');
