// test_complex.ts — More complex compilation tests

import { Compiler } from './src/compiler/index';
import { decompile } from './src/decompiler';
import * as fs from 'fs';

const tests = [
  {
    name: 'Simple arithmetic',
    code: `
function add(%a, %b)
{
  return %a + %b;
}
`
  },
  {
    name: 'If/else',
    code: `
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
`
  },
  {
    name: 'While loop',
    code: `
function count(%n)
{
  %i = 0;
  while (%i < %n)
  {
    %i = %i + 1;
  }
  return %i;
}
`
  },
  {
    name: 'String concatenation',
    code: `
function greet(%name)
{
  return "Hello " @ %name @ "!";
}
`
  },
  {
    name: 'Nested function calls',
    code: `
function outer(%a)
{
  return add(%a, 5);
}

function add(%x, %y)
{
  return %x + %y;
}
`
  },
  {
    name: 'Local and global vars',
    code: `
function test()
{
  %local = 10;
  $global = 20;
  return %local + $global;
}
`
  },
  {
    name: 'For loop',
    code: `
function sum(%n)
{
  %total = 0;
  for (%i = 0; %i < %n; %i++)
  {
    %total = %total + %i;
  }
  return %total;
}
`
  },
  {
    name: 'Switch statement',
    code: `
function describe(%x)
{
  switch (%x)
  {
    case 1:
      return "one";
    case 2:
      return "two";
    default:
      return "other";
  }
}
`
  },
];

let passed = 0, failed = 0;

for (const test of tests) {
  try {
    const compiler = new Compiler('TGE10');
    const bytecode = compiler.compile(test.code);
    fs.writeFileSync('/tmp/test_complex.cs.dso', bytecode);
    const fb = fs.readFileSync('/tmp/test_complex.cs.dso');
    const ab = fb.buffer.slice(fb.byteOffset, fb.byteOffset + fb.byteLength);
    const result = decompile(ab, 'TGE10');
    if (result.success) {
      console.log(`OK: ${test.name} (${bytecode.length} bytes)`);
      passed++;
    } else {
      console.log(`FAIL: ${test.name} - ${result.error}`);
      failed++;
    }
  } catch (e: any) {
    console.log(`ERROR: ${test.name} - ${e.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
