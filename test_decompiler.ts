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
    const result = decompile(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), 'Tribes2');

    if (result.success) {
      console.log(`SUCCESS! Output length: ${result.output.length} chars`);
      console.log(`Engine: ${result.engineName}`);
      if (result.debug) {
        console.log(`Debug: version=${result.debug.version}, codeEntries=${result.debug.codeEntries}, lineBreaks=${result.debug.lineBreaksCount}`);
      }
      // Write output
      writeFileSync(`/tmp/${name}.decompiled.cs`, result.output);
      console.log(`Output written to /tmp/${name}.decompiled.cs`);
      // Show first 500 chars
      console.log(`\nFirst 500 chars of output:\n${result.output.substring(0, 500)}`);
    } else {
      console.log(`FAILED: ${result.error}`);
      if (result.debug) {
        console.log(`Debug: ${JSON.stringify(result.debug, null, 2)}`);
      }
    }
  } catch (e: any) {
    console.log(`EXCEPTION: ${e.message}`);
    console.log(e.stack?.split('\n').slice(0, 5).join('\n'));
  }
}
