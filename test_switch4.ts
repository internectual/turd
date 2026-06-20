// test_switch4.ts — Debug switch token type

import { Scanner, TokenType } from './src/compiler/scanner';
import { Parser } from './src/compiler/parser';

const code = `switch (%x) { case 1: return "one"; }`;

const scanner = new Scanner(code);
const tokens = scanner.scanTokens();

for (const tok of tokens) {
  console.log(`  ${TokenType[tok.type]}(${tok.lexeme}) type=${tok.type}`);
}

console.log(`\nSwitch token type: ${TokenType.Switch}`);

const parser = new Parser(tokens);
// Check what the parser sees
const peek = (parser as any).peek();
console.log(`Parser first token: ${TokenType[peek.type]} type=${peek.type}`);
console.log(`Is Switch? ${peek.type === TokenType.Switch}`);
