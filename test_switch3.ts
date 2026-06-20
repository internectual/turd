// test_switch3.ts — Debug switch

import { Scanner, TokenType, makeToken } from './src/compiler/scanner';
import { Parser } from './src/compiler/parser';

const code = `
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
`;

const scanner = new Scanner(code);
const tokens = scanner.scanTokens();
const parser = new Parser(tokens);

try {
  const ast = parser.parse();
  console.log(`Parsed ${ast.length} statements`);
  for (const s of ast) {
    console.log(`  ${s.constructor.name} at line ${s.lineNo}`);
  }
} catch (e: any) {
  console.log(`Parse error: ${e.message}`);
  console.log(e.stack?.split('\n').slice(0, 5).join('\n'));
}
