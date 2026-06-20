import { decompile } from './src/decompiler';
import * as fs from 'fs';

// Try to decompile a real DSO file
const files = fs.readdirSync('/home/methodown/Downloads/mechina/herc_scripts/').filter(f => f.endsWith('.dso'));
console.log('Found DSO files:', files.length);

if (files.length > 0) {
  const data = fs.readFileSync('/home/methodown/Downloads/mechina/herc_scripts/' + files[0]);
  const result = decompile(new Uint8Array(data));
  console.log('Decompile result:', result.ok);
  if (result.ok) {
    console.log('Source (first 200 chars):', result.source?.substring(0, 200));
  } else {
    console.log('Error:', result.error);
  }
}
