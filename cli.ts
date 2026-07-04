import { Compiler } from './src/compiler';

// CLI: reads source file path from argv[2], writes .dso to argv[3] (or stdout)
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node cli.js <source.cs> [output.dso]");
  process.exit(1);
}

const fs = require('fs');
const sourcePath = args[0];
const outPath = args[1] || sourcePath + '.dso';

const code = fs.readFileSync(sourcePath, 'utf-8');
const compiler = new Compiler('TGE10');
const dso = compiler.compile(code);
fs.writeFileSync(outPath, Buffer.from(dso));
console.log(`Compiled ${sourcePath} -> ${outPath} (${dso.length} bytes)`);
