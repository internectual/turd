// test_switch.ts — Debug switch parsing

import { Scanner, TokenType } from './src/compiler/scanner';
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

// Print tokens
for (const tok of tokens) {
  if (tok.type !== TokenType.Eof && tok.type !== TokenType.Comment)
    console.log(`  ${TokenType[tok.type]}(${tok.lexeme})`);
}

try {
  const parser = new Parser(tokens);
  const ast = parser.parse();
  console.log(`Parsed ${ast.length} statements`);
} catch (e: any) {
  console.log(`Parse error: ${e.message}`);
}
