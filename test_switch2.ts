// test_switch2.ts — Debug switch parsing more

import { Scanner, TokenType } from './src/compiler/scanner';
import { Parser } from './src/compiler/parser';

// Simpler test - just a switch at top level (not inside a function)
const code = `
function describe(%x)
{
  switch (%x)
  {
    case 1:
      return "one";
  }
}
`;

const scanner = new Scanner(code);
const tokens = scanner.scanTokens();
const parser = new Parser(tokens);

// Monkey-patch to add debug
const origStmt = (parser as any).stmt.bind(parser);
(parser as any).stmt = function() {
  const tok = (parser as any).peek();
  console.log(`stmt() called, current token: ${TokenType[tok.type]}(${tok.lexeme})`);
  return origStmt();
};

try {
  const ast = parser.parse();
  console.log(`Parsed ${ast.length} statements`);
} catch (e: any) {
  console.log(`Parse error: ${e.message}`);
}
