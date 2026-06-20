import { Compiler } from './src/compiler/index';
import * as fs from 'fs';
import * as path from 'path';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const outputDir = '/tmp/decomptest';
const targets = ['TGE10', 'Tribes2', 'TFD'];
const prefixes = { TGE10: 'tge10', Tribes2: 'tribes2', TFD: 'tfd' };

for (const target of targets) {
  const compiler = new Compiler(target);
  const bytecode = compiler.compile(code);
  const filename = prefixes[target] + '.console_start.cs.dso';
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(bytecode));
  console.log(filename + ': ' + bytecode.length + ' bytes');
}

// Create zip
const { execSync } = require('child_process');
execSync('cd /tmp/decomptest && python3 -c "import zipfile, os; zf = zipfile.ZipFile(\'/tmp/decomptest.vl2\', \'w\', zipfile.ZIP_DEFLATED); [zf.write(f, f) for f in sorted(os.listdir(\'.\')) if f.endswith(\'.dso\')]; zf.close()"');
console.log('Created /tmp/decomptest.vl2');
