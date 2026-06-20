#!/usr/bin/env node
// apply-fixes.js — Apply all compiler and decompiler fixes
const fs = require('fs');

// === Fix compiler-types.ts ===
fs.writeFileSync('src/compiler/compiler-types.ts', `// compiler-types.ts — Types for the TorqueScript compiler
export interface StringTableEntry {
  string: string;
  start: number;
  len: number;
  tag: boolean;
}

export class StringTable {
  entries: StringTableEntry[] = [];
  private stringToIndex: Map<string, number> = new Map();
  totalLen = 0;
  counting = false;

  add(str: string, caseSens: boolean, tag: boolean): number {
    if (this.counting) return 0;
    const key = caseSens ? str : str.toLowerCase();
    if (this.stringToIndex.has(key)) return this.stringToIndex.get(key)!;
    const len = tag && str.length + 1 < 7 ? 7 : str.length + 1;
    const entry: StringTableEntry = { string: str, start: this.totalLen, len, tag };
    this.entries.push(entry);
    this.totalLen += len;
    this.stringToIndex.set(key, entry.start);
    return entry.start;
  }

  build(): string {
    let buf = '';
    for (const e of this.entries) buf += e.string + '\\0';
    return buf;
  }
}

export class IdentTable {
  identMap: Map<number, number[]> = new Map();
  ipToIdentMap: Map<number, string> = new Map();

  add(strTable: StringTable, ident: string, ip: number): void {
    if (strTable.counting) return;
    const index = strTable.add(ident, false, false);
    if (this.identMap.has(index)) {
      this.identMap.get(index)!.push(ip);
    } else {
      this.identMap.set(index, [ip]);
    }
    this.ipToIdentMap.set(ip, ident);
  }

  reset(): void {
    this.identMap.clear();
    this.ipToIdentMap.clear();
  }
}

export class CompileContext {
  codeStream: number[];
  lineBreakPairs: number[];
  ip = 0;
  continuePoint = 0;
  breakPoint = 0;

  constructor(codeSize: number, lineBreakPairSize: number) {
    this.codeStream = new Array(codeSize).fill(0);
    this.lineBreakPairs = new Array(lineBreakPairSize).fill(0);
  }
}
`);

// === Fix compiler.ts ===
let comp = fs.readFileSync('src/compiler/compiler.ts', 'utf8');

// Add counting field
comp = comp.replace(
  '  private dsoVersion: number;',
  '  private dsoVersion: number;\n  private counting = false;'
);

// Replace compileAST with two-pass
comp = comp.replace(
  `  compileAST(stmts: AST.Stmt[]): Uint8Array {
    this.globalFloatTable = [];
    this.functionFloatTable = [];
    this.globalStringTable = new StringTable();
    this.functionStringTable = new StringTable();
    this.identTable = new IdentTable();
    this.currentStringTable = this.globalStringTable;
    this.currentFloatTable = this.globalFloatTable;
    this.inFunction = false;
    this.breakLineCount = 0;

    const codeSize = this.precompileBlock(stmts, 0) + 1;
    const breakCount = this.breakLineCount;
    const lineBreakPairCount = breakCount * 2;
    const context = new CompileContext(codeSize, lineBreakPairCount);

    this.breakLineCount = 0;
    if (stmts.length > 0) this.compileBlock(context, stmts);
    context.codeStream[context.ip++] = this.getOpcodeValue(OpCode.Return);

    return this.serialize(context, codeSize, breakCount);
  }`,
  `  compileAST(stmts: AST.Stmt[]): Uint8Array {
    this.globalFloatTable = [];
    this.functionFloatTable = [];
    this.globalStringTable = new StringTable();
    this.functionStringTable = new StringTable();
    this.identTable = new IdentTable();
    this.currentStringTable = this.globalStringTable;
    this.currentFloatTable = this.globalFloatTable;
    this.inFunction = false;
    this.breakLineCount = 0;

    // Pass 1: count slots (no state modifications)
    this.counting = true;
    this.globalStringTable.counting = true;
    this.functionStringTable.counting = true;
    const countCtx = new CompileContext(200000, 200000);
    this.compileBlock(countCtx, stmts);
    const codeSize = countCtx.ip + 1;
    const breakCount = this.breakLineCount;
    const lineBreakPairCount = breakCount * 2;

    // Pass 2: emit bytecode
    this.counting = false;
    this.globalStringTable.counting = false;
    this.functionStringTable.counting = false;
    this.identTable.reset();
    const context = new CompileContext(codeSize, lineBreakPairCount);
    this.breakLineCount = 0;
    if (stmts.length > 0) this.compileBlock(context, stmts);
    this.emit(context, this.getOpcodeValue(OpCode.Return));

    return this.serialize(context, codeSize, lineBreakPairCount);
  }`
);

// Update helpers
comp = comp.replace(
  `  // --- Helpers ---
  private emit(c: CompileContext, ...ops: number[]): void {
    for (const op of ops) {
      c.codeStream[c.ip++] = op;
    }
  }

  private context_ip(c: CompileContext): number { const ip = c.ip; c.ip++; return ip; }

  private addBreakLine(c: CompileContext, lineNo: number): void {
    if (this.inFunction) {
      const line = this.breakLineCount * 2;
      this.breakLineCount++;
      if (c.lineBreakPairs.length > 0) { c.lineBreakPairs[line] = lineNo; c.lineBreakPairs[line + 1] = c.ip; }
    }
  }`,
  `  // --- Helpers ---
  private emit(c: any, ...ops: number[]): void {
    if (this.counting) { c.ip += ops.length; return; }
    for (const op of ops) { c.codeStream[c.ip++] = op; }
  }

  private context_ip(c: any): number {
    if (this.counting) { const ip = c.ip; c.ip++; return ip; }
    const ip = c.ip; c.ip++; c.codeStream[ip] = 0; return ip;
  }

  private addBreakLine(c: any, lineNo: number): void {
    if (this.inFunction) {
      this.breakLineCount++;
      if (!this.counting && c.lineBreakPairs.length > 0) {
        c.lineBreakPairs[this.breakLineCount * 2 - 2] = lineNo;
      }
    }
  }`
);

// Fix compileFunction
comp = comp.replace(
  `    this.emit(context, this.getOpcodeValue(OpCode.FuncDecl));
    const nameIp = context.ip++;
    this.identTable.add(this.currentStringTable, fn.functionName.literal, nameIp);
    const nsIp = context.ip++;
    if (fn.namespace) this.identTable.add(this.currentStringTable, fn.namespace.literal, nsIp);
    this.emit(context, fn.stmts.length > 0 ? 1 : 0);
    const endJmpIp = context.ip++;
    this.emit(context, fn.args.length);
    for (const arg of fn.args) {
      const argIp = context.ip++;
      this.identTable.add(this.currentStringTable, (arg.vtype === VarType.Global ? '$' : '%') + arg.name.literal, argIp);
    }`,
  `    this.emit(context, this.getOpcodeValue(OpCode.FuncDecl));
    const nameIp = this.context_ip(context);
    this.identTable.add(this.globalStringTable, fn.functionName.literal, nameIp);
    const nsIp = this.context_ip(context);
    if (fn.namespace) this.identTable.add(this.globalStringTable, fn.namespace.literal, nsIp);
    const pkgIp = this.context_ip(context);
    if (fn.packageName) this.identTable.add(this.globalStringTable, fn.packageName.literal, pkgIp);
    this.emit(context, fn.stmts.length > 0 ? 1 : 0);
    const endJmpIp = this.context_ip(context);
    this.emit(context, fn.args.length);
    for (const arg of fn.args) {
      const argIp = this.context_ip(context);
      this.identTable.add(this.globalStringTable, (arg.vtype === VarType.Global ? '$' : '%') + arg.name.literal, argIp);
    }`
);

// Fix compileIf
comp = comp.replace(
  '    const jmpIp = context.ip++;\n    this.compileBlock(context, stmt.body);\n    if (stmt.elseBody) {\n      this.emit(context, this.getOpcodeValue(OpCode.Jmp));\n      const endJmpIp = context.ip++;',
  '    const jmpIp = this.context_ip(context);\n    this.compileBlock(context, stmt.body);\n    if (stmt.elseBody) {\n      this.emit(context, this.getOpcodeValue(OpCode.Jmp));\n      const endJmpIp = this.context_ip(context);'
);

// Fix compileLoop
comp = comp.replace(
  '    const breakJmpIp = context.ip++;',
  '    const breakJmpIp = this.context_ip(context);'
);

// Fix compileAssign - remove extra c.ip++
comp = comp.replace(
  '    if (t !== sub) this.emit(c, this.getOpcodeValue(this.conversionOp(sub, t)));\n    c.ip++;\n  }',
  '    if (t !== sub) this.emit(c, this.getOpcodeValue(this.conversionOp(sub, t)));\n  }'
);

// Fix header lineBreaks
comp = comp.replace(
  '    // 7. Line break pair count\n    writeU32(lineBreakPairCount);',
  '    // 7. Line break count (decompiler reads lineBreaks*2 u32s)\n    writeU32(lineBreakPairCount / 2);'
);

// Remove precompile methods
const precompileStart = comp.indexOf('  // --- Precompile pass ---');
const compilePassStart = comp.indexOf('  // --- Compile pass ---');
if (precompileStart >= 0 && compilePassStart >= 0) {
  comp = comp.substring(0, precompileStart) + comp.substring(compilePassStart);
}

fs.writeFileSync('src/compiler/compiler.ts', comp);

// === Fix decompiler.ts ===
let decomp = fs.readFileSync('src/decompiler.ts', 'utf8');

// Fix validation
decomp = decomp.replace(
  '    if (inst.hasBody && inst.endAddress >= reader.codeSize) {',
  '    if (inst.hasBody && inst.endAddress > reader.codeSize) {'
);

// Fix function body parsing
decomp = decomp.replace(
  `    if (instruction instanceof FunctionInstruction) {
      const body = this.parseRange(this.current!.address, instruction.endAddress - 1);`,
  `    if (instruction instanceof FunctionInstruction) {
      const bodyStart = instruction.address + 7 + instruction.arguments.length;
      const bodyEnd = instruction.endAddress;
      const savedCurrent = this.current;
      const savedEndAddress = this.endAddress;
      this.current = this.disasm.get(bodyStart);
      this.endAddress = bodyEnd;
      this.run();
      const body = [...this.nodeStack];
      this.nodeStack.length = 0;
      this.current = this.disasm.get(bodyEnd + 1);
      if (!this.current) this.running = false;
      this.endAddress = savedEndAddress;`
);

fs.writeFileSync('src/decompiler.ts', decomp);

console.log('All fixes applied!');
