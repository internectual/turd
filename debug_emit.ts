import { Compiler } from './src/compiler/index';
import * as fs from 'fs';

const code = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');
const c = new Compiler('TGE10');

// Monkey-patch emit to log
const origEmit = (c as any).emit.bind(c);
let emitLog: string[] = [];
(c as any).emit = function(context: any, ...ops: number[]) {
  if (context && context.ip >= 250 && context.ip <= 260) {
    emitLog.push('emit at ip=' + context.ip + ' ops=' + JSON.stringify(ops));
  }
  return origEmit(context, ...ops);
};

// Monkey-patch context_ip to log
const origContextIp = (c as any).context_ip.bind(c);
let contextIpLog: string[] = [];
(c as any).context_ip = function(context: any) {
  const result = origContextIp(context);
  if (context && context.ip >= 250 && context.ip <= 265) {
    contextIpLog.push('context_ip at ip=' + context.ip + ' returned=' + result);
  }
  return result;
};

const b = c.compile(code);

console.log('Emit log (ip 250-260):');
for (const log of emitLog) console.log('  ' + log);

console.log('\nContext_ip log (ip 250-265):');
for (const log of contextIpLog) console.log('  ' + log);
