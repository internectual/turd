import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

let countingPositions: number[] = [];
let emitPositions: number[] = [];

// Patch context_ip
const origContextIp = c.context_ip.bind(c);
c.context_ip = function(context: any): number {
  const ip = origContextIp(context);
  if (this.counting) {
    countingPositions.push(ip);
  } else {
    emitPositions.push(ip);
  }
  return ip;
};

const b = c.compile(code);

console.log('Counting positions:', countingPositions.length);
console.log('Emit positions:', emitPositions.length);
console.log('Match:', countingPositions.length === emitPositions.length);

if (countingPositions.length === emitPositions.length) {
  let allMatch = true;
  for (let i = 0; i < countingPositions.length; i++) {
    if (countingPositions[i] !== emitPositions[i]) {
      console.log('MISMATCH at index', i, ':', countingPositions[i], 'vs', emitPositions[i]);
      allMatch = false;
      if (i > 5) break;
    }
  }
  console.log('All positions match:', allMatch);
}
