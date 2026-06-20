// test_nested.ts — Debug nested function

import { Scanner, TokenType } from './src/compiler/scanner';
import { Parser } from './src/compiler/parser';
import { FunctionDeclStmt } from './src/compiler/ast';

const code = `
function outer(%a)
{
  return add(%a, 5);
}

function add(%x, %y)
{
  return %x + %y;
}
`;

const scanner = new Scanner(code);
const tokens = scanner.scanTokens();
const parser = new Parser(tokens);

try {
  const ast = parser.parse();
  console.log(`Parsed ${ast.length} statements`);
  for (const s of ast) {
    console.log(`  ${s.constructor.name} at line ${s.lineNo}`);
    if (s instanceof FunctionDeclStmt) {
      console.log(`    name: ${s.functionName.literal}`);
    }
  }
} catch (e: any) {
  console.log(`Parse error: ${e.message}`);
  console.log(e.stack?.split('\n').slice(0, 8).join('\n'));
}
