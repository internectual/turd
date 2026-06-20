// test_switch5.ts — Debug switch inside function

import { Scanner, TokenType } from './src/compiler/scanner';
import { Parser } from './src/compiler/parser';

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

// Monkey-patch stmt to trace
const origStmt = (parser as any).stmt.bind(parser);
let depth = 0;
(parser as any).stmt = function() {
  const tok = (parser as any).peek();
  console.log(`${'  '.depth}stmt(): token=${TokenType[tok.type]}(${tok.lexeme}) line=${tok.line}`);
  depth++;
  const result = origStmt();
  depth--;
  if (result) console.log(`${'  '.depth}-> ${result.constructor.name}`);
  else console.log(`${'  '.depth}-> null`);
  return result;
};

try {
  const ast = parser.parse();
  console.log(`\nParsed ${ast.length} statements`);
} catch (e: any) {
  console.log(`\nParse error: ${e.message}`);
}
