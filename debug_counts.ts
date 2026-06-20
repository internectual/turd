import { Compiler } from './src/compiler/index';

// Test with the simple case
const code = 'function test() { return 1; }';
const c = new Compiler('TGE10');
const b = c.compile(code);

// The simple test works, so precompile matches compile for it.
// Let me check what the precompile counts for each statement type

// Manually trace the precompile for the simple test:
// precompileBlock([ReturnStmt], 0)
//   precompileStmt(ReturnStmt, 0)
//     return 1 + precompileExpr(IntExpr(1), TypeReq.String)
//     precompileExpr returns 2 (LoadImmedStr + string_index)
//   return 1 + 2 = 3
// codeSize = 3 + 1 = 4

// But the actual compile emits:
// FuncDecl: 1
// name: 1
// ns: 1
// pkg: 1
// hasBody: 1
// endAddress: 1
// argc: 1
// body (ReturnStmt): 3 (LoadImmedStr + string_index + Return)
// final Return: 1
// Total: 12

console.log('Bytecode length:', b.length);

// For the simple test, codeSize = 12 and context.ip = 12 (they match)
// For console_start.cs, codeSize = 15086 but context.ip = 17906 (diff = 2820)

// The diff of 2820 must be from specific statement types that undercount
// Let me count the occurrences of each statement type in console_start.cs
import * as fs from 'fs';
const cs = fs.readFileSync('/home/methodown/t2-linux/console_start.cs', 'utf8');

// Rough counts
const switches = (cs.match(/\bswitch\b/g) || []).length;
const futures = (cs.match(/\bfor\b/g) || []).length;
const whiles = (cs.match(/\bwhile\b/g) || []).length;
const ifs = (cs.match(/\bif\b/g) || []).length;
const returns = (cs.match(/\breturn\b/g) || []).length;
const news = (cs.match(/\bnew\b/g) || []).length;
const functions = (cs.match(/\bfunction\b/g) || []).length;

console.log('Statement counts:');
console.log('  switch:', switches);
console.log('  for:', futures);
console.log('  while:', whiles);
console.log('  if:', ifs);
console.log('  return:', returns);
console.log('  new:', news);
console.log('  function:', functions);

// If each new expression has a 1-slot discrepancy, that's 101 slots
// But the diff is 2820, so there must be other issues

// Let me check if the issue is with switch statements
// A switch with N cases would have N IfStmt nodes
// Each IfStmt has: exprSize + 2 + ifSize + (elseBody ? 2 + elseSize : 0)
// The elseBody of each case is the next case (another IfStmt)
// This should be counted correctly by the recursive precompile

// The diff of 2820 / 3 switches = 940 per switch
// That's a lot for a single switch statement
