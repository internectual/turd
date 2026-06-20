import { Compiler, OpCode } from './src/compiler/index';
import { OPS_MAPS } from './src/opcodes';

const c = new Compiler('TGE10');
const ops = (c as any).ops;

console.log('OP_CALLFUNC_RESOLVE in values?', 'OP_CALLFUNC_RESOLVE' in ops.values);
console.log('OP_CALLFUNC_RESOLVE value:', ops.values['OP_CALLFUNC_RESOLVE']);
console.log('OP_CALLFUNC value:', ops.values['OP_CALLFUNC']);

// Check the full values map
console.log('\nAll CALLFUNC entries:');
for (const [k, v] of Object.entries(ops.values)) {
  if (k.includes('CALLFUNC')) {
    console.log('  ' + k + ' = ' + v);
  }
}

// Check what getOpcodeValue returns
console.log('\ngetOpcodeValue(CallFuncResolve):', (c as any).getOpcodeValue(OpCode.CallFuncResolve));

// Check the opcodeNameMap
const opcodeNameMap = (c as any).opcodeNameMap;
console.log('\nopcodeNameMap[70]:', opcodeNameMap[70]);
console.log('opcodeNameMap[71]:', opcodeNameMap[71]);
