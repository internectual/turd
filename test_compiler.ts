// test_compiler.ts — Test the TorqueScript compiler

import { Compiler } from './src/compiler/index';

// Test 1: Simple function
const test1 = `
function testFunc(%a, %b)
{
  %c = %a + %b;
  return %c;
}
`;

// Test 2: If/else
const test2 = `
function check(%x)
{
  if (%x > 10)
  {
    return "big";
  }
  else
  {
    return "small";
  }
}
`;

// Test all targets
const targets = ['TGE10', 'Tribes2', 'TGE14', 'Constructor', 'TFD', 'BlocklandV1', 'BlocklandV20', 'BlocklandV21'];
const tests = [test1, test2];
const testNames = ['Simple function', 'If/else'];

for (const target of targets) {
  console.log(`\n=== Target: ${target} ===`);
  for (let i = 0; i < tests.length; i++) {
    try {
      const compiler = new Compiler(target);
      const result = compiler.compile(tests[i]);
      console.log(`  ${testNames[i]}: OK (${result.length} bytes)`);
    } catch (e: any) {
      console.log(`  ${testNames[i]}: ERROR - ${e.message}`);
    }
  }
}
