import { Compiler } from './src/compiler/index';
import { decompile } from './src/decompiler';

const code = `
function test(%x)
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

function add(%a, %b)
{
  return %a + %b;
}
`;

const c = new Compiler('TGE10');
const b = c.compile(code);
console.log('Compiled:', b.length, 'bytes');

const result = decompile(new Uint8Array(b));
if (result.ok) {
  console.log('Decompile OK! Lines:', result.source.split('\n').length);
  console.log(result.source);
} else {
  console.log('Decompile FAIL:', result.error);
}
