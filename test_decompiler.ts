// test_decompiler.ts - Test the decompiler with a real DSO file
import { readFileSync, writeFileSync } from 'fs';
import { decompile } from './src/decompiler';

const files = [
  '/home/methodown/Downloads/mechina/herc_scripts/gui/IPJoinDlg.gui.dso',
  '/home/methodown/Downloads/mechina/herc_scripts/scripts/serverDefaults.cs.dso',
  '/home/methodown/Downloads/mechina/herc_scripts/scripts/client/hercHuds.cs.dso',
  '/home/methodown/Downloads/mechina/herc_scripts/console_end.cs.dso',
];

for (const file of files) {
  const name = file.split('/').pop()!;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log('='.repeat(60));

  try {
    const buffer = readFileSync(file);
    console.log(`File size: ${buffer.length} bytes`);

    // Try with Tribes 2 engine
    const result = decompile(new Uint8Array(buffer));

    if (result.ok && result.source !== undefined) {
      console.log(`SUCCESS! Output length: ${result.source.length} chars`);
      if (result.stats) {
        console.log(`Stats: instructions=${result.stats.instructionCount}, codeSize=${result.stats.codeSize}`);
      }
      // Write output
      writeFileSync(`/tmp/${name}.decompiled.cs`, result.source);
      console.log(`Output written to /tmp/${name}.decompiled.cs`);
      // Show first 500 chars
      console.log(`\nFirst 500 chars of output:\n${result.source.substring(0, 500)}`);
    } else {
      console.log(`FAILED: ${result.error}`);
    }
  } catch (e: any) {
    console.log(`EXCEPTION: ${e.message}`);
    console.log(e.stack?.split('\n').slice(0, 5).join('\n'));
  }
}
