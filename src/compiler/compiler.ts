// compiler.ts — TorqueScript compiler: AST -> bytecode for any dso-sharp target
// Produces binary DSO files compatible with dso-sharp's FileLoader

import { Token, TokenType, Scanner } from './scanner';
import { Parser } from './parser';
import * as AST from './ast';
import { TypeReq, VarType, FuncCallType } from './ast';
import { OpsMap, OPS_MAPS } from '../opcodes';

export { StringTable, IdentTable, CompileContext } from './compiler-types';
import { StringTable, IdentTable, CompileContext } from './compiler-types';

export enum OpCode {
  FuncDecl = 0, CreateObject = 1, CreateDataBlock = 2, NameObject = 3,
  AddObject = 4, EndObject = 5, JmpIffNot = 6, JmpIfNot = 7,
  JmpIff = 8, JmpIf = 9, JmpIfNotNP = 10, JmpIfNP = 11,
  Jmp = 12, Return = 13, CmpEQ = 14, CmpGT = 15,
  CmpGE = 16, CmpLT = 17, CmpLE = 18, CmpNE = 19,
  Xor = 20, Mod = 21, BitAnd = 22, BitOr = 23,
  Not = 24, NotF = 25, OnesComplement = 26, Shr = 27,
  Shl = 28, And = 29, Or = 30, Add = 31,
  Sub = 32, Mul = 33, Div = 34, Neg = 35,
  SetCurVar = 36, SetCurVarCreate = 37, SetCurVarArray = 38, SetCurVarArrayCreate = 39,
  LoadVarUInt = 40, LoadVarFlt = 41, LoadVarStr = 42,
  SaveVarUInt = 43, SaveVarFlt = 44, SaveVarStr = 45,
  SetCurObject = 46, SetCurObjectNew = 47, SetCurField = 48, SetCurFieldArray = 49,
  LoadFieldUInt = 50, LoadFieldFlt = 51, LoadFieldStr = 52,
  SaveFieldUInt = 53, SaveFieldFlt = 54, SaveFieldStr = 55,
  StrToUInt = 56, StrToFlt = 57, StrToNone = 58,
  FltToUInt = 59, FltToStr = 60, FltToNone = 61,
  UIntToFlt = 62, UIntToStr = 63, UIntToNone = 64,
  LoadImmedUInt = 65, LoadImmedFlt = 66, TagToStr = 67, LoadImmedStr = 68,
  LoadImmedIdent = 69, CallFuncResolve = 70, CallFunc = 71,
  ProcessArgs = 72, AdvanceStr = 73, AdvanceStrAppendChar = 74,
  AdvanceStrComma = 75, AdvanceStrNul = 76, RewindStr = 77,
  TerminateRewindStr = 78, CompareStr = 79, Push = 80,
  PushFrame = 81, Break = 82, Invalid = 83,
}

const opcodeNameMap: Record<number, string> = {};
opcodeNameMap[OpCode.FuncDecl] = 'OP_FUNC_DECL';
opcodeNameMap[OpCode.CreateObject] = 'OP_CREATE_OBJECT';
opcodeNameMap[OpCode.AddObject] = 'OP_ADD_OBJECT';
opcodeNameMap[OpCode.EndObject] = 'OP_END_OBJECT';
opcodeNameMap[OpCode.JmpIffNot] = 'OP_JMPIFFNOT';
opcodeNameMap[OpCode.JmpIfNot] = 'OP_JMPIFNOT';
opcodeNameMap[OpCode.JmpIff] = 'OP_JMPIFF';
opcodeNameMap[OpCode.JmpIf] = 'OP_JMPIF';
opcodeNameMap[OpCode.JmpIfNotNP] = 'OP_JMPIFNOT_NP';
opcodeNameMap[OpCode.JmpIfNP] = 'OP_JMPIF_NP';
opcodeNameMap[OpCode.Jmp] = 'OP_JMP';
opcodeNameMap[OpCode.Return] = 'OP_RETURN';
opcodeNameMap[OpCode.CmpEQ] = 'OP_CMPEQ';
opcodeNameMap[OpCode.CmpGT] = 'OP_CMPGR';
opcodeNameMap[OpCode.CmpGE] = 'OP_CMPGE';
opcodeNameMap[OpCode.CmpLT] = 'OP_CMPLT';
opcodeNameMap[OpCode.CmpLE] = 'OP_CMPLE';
opcodeNameMap[OpCode.CmpNE] = 'OP_CMPNE';
opcodeNameMap[OpCode.Xor] = 'OP_XOR';
opcodeNameMap[OpCode.Mod] = 'OP_MOD';
opcodeNameMap[OpCode.BitAnd] = 'OP_BITAND';
opcodeNameMap[OpCode.BitOr] = 'OP_BITOR';
opcodeNameMap[OpCode.Not] = 'OP_NOT';
opcodeNameMap[OpCode.NotF] = 'OP_NOTF';
opcodeNameMap[OpCode.OnesComplement] = 'OP_ONESCOMPLEMENT';
opcodeNameMap[OpCode.Shr] = 'OP_SHR';
opcodeNameMap[OpCode.Shl] = 'OP_SHL';
opcodeNameMap[OpCode.And] = 'OP_AND';
opcodeNameMap[OpCode.Or] = 'OP_OR';
opcodeNameMap[OpCode.Add] = 'OP_ADD';
opcodeNameMap[OpCode.Sub] = 'OP_SUB';
opcodeNameMap[OpCode.Mul] = 'OP_MUL';
opcodeNameMap[OpCode.Div] = 'OP_DIV';
opcodeNameMap[OpCode.Neg] = 'OP_NEG';
opcodeNameMap[OpCode.SetCurVar] = 'OP_SETCURVAR';
opcodeNameMap[OpCode.SetCurVarCreate] = 'OP_SETCURVAR_CREATE';
opcodeNameMap[OpCode.SetCurVarArray] = 'OP_SETCURVAR_ARRAY';
opcodeNameMap[OpCode.SetCurVarArrayCreate] = 'OP_SETCURVAR_ARRAY_CREATE';
opcodeNameMap[OpCode.LoadVarUInt] = 'OP_LOADVAR_UINT';
opcodeNameMap[OpCode.LoadVarFlt] = 'OP_LOADVAR_FLT';
opcodeNameMap[OpCode.LoadVarStr] = 'OP_LOADVAR_STR';
opcodeNameMap[OpCode.SaveVarUInt] = 'OP_SAVEVAR_UINT';
opcodeNameMap[OpCode.SaveVarFlt] = 'OP_SAVEVAR_FLT';
opcodeNameMap[OpCode.SaveVarStr] = 'OP_SAVEVAR_STR';
opcodeNameMap[OpCode.SetCurObject] = 'OP_SETCUROBJECT';
opcodeNameMap[OpCode.SetCurObjectNew] = 'OP_SETCUROBJECT_NEW';
opcodeNameMap[OpCode.SetCurField] = 'OP_SETCURFIELD';
opcodeNameMap[OpCode.SetCurFieldArray] = 'OP_SETCURFIELD_ARRAY';
opcodeNameMap[OpCode.LoadFieldUInt] = 'OP_LOADFIELD_UINT';
opcodeNameMap[OpCode.LoadFieldFlt] = 'OP_LOADFIELD_FLT';
opcodeNameMap[OpCode.LoadFieldStr] = 'OP_LOADFIELD_STR';
opcodeNameMap[OpCode.SaveFieldUInt] = 'OP_SAVEFIELD_UINT';
opcodeNameMap[OpCode.SaveFieldFlt] = 'OP_SAVEFIELD_FLT';
opcodeNameMap[OpCode.SaveFieldStr] = 'OP_SAVEFIELD_STR';
opcodeNameMap[OpCode.StrToUInt] = 'OP_STR_TO_UINT';
opcodeNameMap[OpCode.StrToFlt] = 'OP_STR_TO_FLT';
opcodeNameMap[OpCode.StrToNone] = 'OP_STR_TO_NONE';
opcodeNameMap[OpCode.FltToUInt] = 'OP_FLT_TO_UINT';
opcodeNameMap[OpCode.FltToStr] = 'OP_FLT_TO_STR';
opcodeNameMap[OpCode.FltToNone] = 'OP_FLT_TO_NONE';
opcodeNameMap[OpCode.UIntToFlt] = 'OP_UINT_TO_FLT';
opcodeNameMap[OpCode.UIntToStr] = 'OP_UINT_TO_STR';
opcodeNameMap[OpCode.UIntToNone] = 'OP_UINT_TO_NONE';
opcodeNameMap[OpCode.LoadImmedUInt] = 'OP_LOADIMMED_UINT';
opcodeNameMap[OpCode.LoadImmedFlt] = 'OP_LOADIMMED_FLT';
opcodeNameMap[OpCode.TagToStr] = 'OP_TAG_TO_STR';
opcodeNameMap[OpCode.LoadImmedStr] = 'OP_LOADIMMED_STR';
opcodeNameMap[OpCode.LoadImmedIdent] = 'OP_LOADIMMED_IDENT';
opcodeNameMap[OpCode.CallFuncResolve] = 'OP_CALLFUNC_RESOLVE';
opcodeNameMap[OpCode.CallFunc] = 'OP_CALLFUNC';
opcodeNameMap[OpCode.AdvanceStr] = 'OP_ADVANCE_STR';
opcodeNameMap[OpCode.AdvanceStrAppendChar] = 'OP_ADVANCE_STR_APPENDCHAR';
opcodeNameMap[OpCode.AdvanceStrComma] = 'OP_ADVANCE_STR_COMMA';
opcodeNameMap[OpCode.AdvanceStrNul] = 'OP_ADVANCE_STR_NUL';
opcodeNameMap[OpCode.RewindStr] = 'OP_REWIND_STR';
opcodeNameMap[OpCode.TerminateRewindStr] = 'OP_TERMINATE_REWIND_STR';
opcodeNameMap[OpCode.CompareStr] = 'OP_COMPARE_STR';
opcodeNameMap[OpCode.Push] = 'OP_PUSH';
opcodeNameMap[OpCode.PushFrame] = 'OP_PUSH_FRAME';
opcodeNameMap[OpCode.Break] = 'OP_BREAK';

export class Compiler {
  private ops: OpsMap;
  private globalFloatTable: number[] = [];
  private functionFloatTable: number[] = [];
  private currentFloatTable: number[];
  private globalStringTable = new StringTable();
  private functionStringTable = new StringTable();
  private currentStringTable: StringTable;
  private identTable = new IdentTable();
  private inFunction = false;
  private breakLineCount = 0;
  private dsoVersion: number;

  constructor(targetId: string = 'TGE10') {
    this.ops = OPS_MAPS[targetId] || OPS_MAPS['TGE10'];
    this.currentStringTable = this.globalStringTable;
    this.currentFloatTable = this.globalFloatTable;
    const versionMap: Record<string, number> = {
      TGE10: 33, Tribes2: 174, TGE14: 36, Constructor: 38,
      TFD: 33, BlocklandV1: 90, BlocklandV20: 190, BlocklandV21: 210,
    };
    this.dsoVersion = versionMap[targetId] || 33;
  }

  private getOpcodeValue(opCode: OpCode): number {
    const tagName = opcodeNameMap[opCode];
    if (!tagName || !(tagName in this.ops.values)) return this.ops.invalid;
    return this.ops.values[tagName];
  }

  compile(code: string): Uint8Array {
    const scanner = new Scanner(code);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    return this.compileAST(ast);
  }

  compileAST(stmts: AST.Stmt[]): Uint8Array {
    this.globalFloatTable = [];
    this.functionFloatTable = [];
    this.globalStringTable = new StringTable();
    this.functionStringTable = new StringTable();
    this.identTable = new IdentTable();
    this.identTable.globalStringTable = this.globalStringTable;
    this.currentStringTable = this.globalStringTable;
    this.currentFloatTable = this.globalFloatTable;
    this.inFunction = false;
    this.breakLineCount = 0;

    const codeSize = this.precompileBlock(stmts, 0) + 1;
    const breakCount = this.breakLineCount;
    const lineBreakPairCount = breakCount * 2;
    const context = new CompileContext(codeSize * 4 + 1024, lineBreakPairCount * 2 + 1024);

    this.breakLineCount = 0;
    if (stmts.length > 0) this.compileBlock(context, stmts);
    context.codeStream[context.ip++] = this.getOpcodeValue(OpCode.Return);

    return this.serialize(context, context.ip, this.breakLineCount * 2);
  }

  // --- Precompile pass ---
  private precompileBlock(stmts: AST.Stmt[], loopCount: number): number {
    let sum = 0;
    for (const s of stmts) sum += this.precompileStmt(s, loopCount);
    return sum;
  }

  private precompileStmt(stmt: AST.Stmt, loopCount: number): number {
    if (stmt instanceof AST.ReturnStmt) {
      this.breakLineCount++;
      return 1 + (stmt.expr ? this.precompileExpr(stmt.expr, TypeReq.String) : 0);
    }
    if (stmt instanceof AST.BreakStmt) {
      if (loopCount > 0) { this.breakLineCount++; return 2; }
      return 0;
    }
    if (stmt instanceof AST.ContinueStmt) {
      if (loopCount > 0) { this.breakLineCount++; return 2; }
      return 0;
    }
    if (stmt instanceof AST.IfStmt) {
      this.breakLineCount++;
      const exprSize = this.precompileExpr(stmt.condition, TypeReq.Float);
      const ifSize = this.precompileBlock(stmt.body, loopCount);
      const elseSize = stmt.elseBody ? this.precompileBlock(stmt.elseBody, loopCount) : 0;
      return exprSize + 2 + ifSize + (stmt.elseBody ? 2 + elseSize : 0);
    }
    if (stmt instanceof AST.LoopStmt) {
      this.breakLineCount++;
      const initSize = stmt.init ? this.precompileExpr(stmt.init, TypeReq.None) : 0;
      const testSize = this.precompileExpr(stmt.condition, TypeReq.Float);
      const blockSize = this.precompileBlock(stmt.body, loopCount + 1);
      const endSize = stmt.end ? this.precompileExpr(stmt.end, TypeReq.None) : 0;
      return initSize + testSize + 2 + blockSize + endSize + testSize + 2;
    }
    if (stmt instanceof AST.FunctionDeclStmt) {
      this.breakLineCount++;
      return this.precompileFunction(stmt);
    }
    if (stmt instanceof AST.PackageDeclStmt) {
      this.breakLineCount++;
      let sum = 0;
      for (const fn of stmt.functions) sum += this.precompileFunction(fn);
      return sum;
    }
    this.breakLineCount++;
    return this.precompileExpr(stmt as AST.Expr, TypeReq.None);
  }

  private precompileExpr(expr: AST.Expr, typeReq: TypeReq): number {
    if (expr instanceof AST.IntExpr || expr instanceof AST.FloatExpr ||
        expr instanceof AST.StringConstExpr || expr instanceof AST.ConstantExpr) {
      return typeReq === TypeReq.None ? 0 : 2;
    }
    if (expr instanceof AST.FloatBinaryExpr) {
      return this.precompileExpr(expr.left, TypeReq.Float) +
             this.precompileExpr(expr.right, TypeReq.Float) + 1 +
             (typeReq !== TypeReq.Float ? 1 : 0);
    }
    if (expr instanceof AST.IntBinaryExpr) {
      return this.precompileExpr(expr.left, TypeReq.Int) +
             this.precompileExpr(expr.right, TypeReq.Int) + 1 +
             (typeReq !== TypeReq.Int ? 1 : 0);
    }
    if (expr instanceof AST.StrCatExpr) {
      return this.precompileExpr(expr.left, TypeReq.String) +
             this.precompileExpr(expr.right, TypeReq.String) + 2 +
             (typeReq !== TypeReq.String ? 1 : 0);
    }
    if (expr instanceof AST.StrEqExpr) {
      return this.precompileExpr(expr.left, TypeReq.String) +
             this.precompileExpr(expr.right, TypeReq.String) + 2 +
             (typeReq !== TypeReq.Int ? 1 : 0);
    }
    if (expr instanceof AST.VarExpr) {
      return typeReq === TypeReq.None ? 0 : (expr.arrayIndex ? 6 : 3);
    }
    if (expr instanceof AST.AssignExpr) {
      return this.precompileExpr(expr.expr, TypeReq.String) + 3;
    }
    if (expr instanceof AST.AssignOpExpr) {
      return this.precompileExpr(expr.expr, TypeReq.Float) + 5;
    }
    if (expr instanceof AST.FuncCallExpr) {
      let size = 5;
      for (const arg of expr.args) size += this.precompileExpr(arg, TypeReq.String) + 1;
      return size;
    }
    if (expr instanceof AST.SlotAccessExpr) {
      return this.precompileExpr(expr.objectExpr, TypeReq.String) + 3 +
             (expr.arrayExpr ? this.precompileExpr(expr.arrayExpr, TypeReq.String) + 3 : 0);
    }
    if (expr instanceof AST.SlotAssignExpr) {
      return this.precompileExpr(expr.expr, TypeReq.String) + 5 +
             (expr.arrayExpr ? this.precompileExpr(expr.arrayExpr, TypeReq.String) + 3 : 0) +
             (expr.objectExpr ? this.precompileExpr(expr.objectExpr, TypeReq.String) : 0);
    }
    if (expr instanceof AST.ObjectDeclExpr) return this.precompileObjectDecl(expr);
    if (expr instanceof AST.ParenthesisExpr) return this.precompileExpr(expr.expr, typeReq);
    if (expr instanceof AST.IntUnaryExpr) return this.precompileExpr(expr.expr, TypeReq.Int) + 1 + (typeReq !== TypeReq.Int ? 1 : 0);
    if (expr instanceof AST.FloatUnaryExpr) return this.precompileExpr(expr.expr, TypeReq.Float) + 1 + (typeReq !== TypeReq.Float ? 1 : 0);
    if (expr instanceof AST.ConditionalExpr) {
      return this.precompileExpr(expr.condition, TypeReq.Int) +
             this.precompileExpr(expr.trueExpr, typeReq) +
             this.precompileExpr(expr.falseExpr, typeReq) + 4;
    }
    return 0;
  }

  private precompileObjectDecl(expr: AST.ObjectDeclExpr): number {
    let size = 10;
    size += this.precompileExpr(expr.className, TypeReq.String) + 1;
    size += this.precompileExpr(expr.objectNameExpr, TypeReq.String) + 1;
    for (const arg of expr.args) size += this.precompileExpr(arg, TypeReq.String) + 1;
    for (const slot of expr.slotDecls) size += this.precompileExpr(slot, TypeReq.None);
    for (const sub of expr.subObjects) size += this.precompileObjectDecl(sub);
    return size;
  }

  private precompileFunction(fn: AST.FunctionDeclStmt): number {
    const prevS = this.currentStringTable, prevF = this.currentFloatTable;
    this.currentStringTable = this.functionStringTable;
    this.currentFloatTable = this.functionFloatTable;
    const bodySize = this.precompileBlock(fn.stmts, 0);
    this.currentStringTable = prevS;
    this.currentFloatTable = prevF;
    return 7 + fn.args.length + bodySize;
  }

  // --- Compile pass ---
  private compileBlock(context: CompileContext, stmts: AST.Stmt[]): void {
    for (const stmt of stmts) this.compileStmt(context, stmt);
  }

  private compileStmt(context: CompileContext, stmt: AST.Stmt): void {
    this.addBreakLine(context, stmt.lineNo);
    if (stmt instanceof AST.ReturnStmt) {
      if (stmt.expr) this.compileExpr(context, stmt.expr, TypeReq.String);
      this.emit(context, this.getOpcodeValue(OpCode.Return));
    } else if (stmt instanceof AST.BreakStmt) {
      if (context.breakPoint > 0) this.emit(context, this.getOpcodeValue(OpCode.Jmp), context.breakPoint);
    } else if (stmt instanceof AST.ContinueStmt) {
      if (context.continuePoint > 0) this.emit(context, this.getOpcodeValue(OpCode.Jmp), context.continuePoint);
    } else if (stmt instanceof AST.IfStmt) {
      this.compileIf(context, stmt);
    } else if (stmt instanceof AST.LoopStmt) {
      this.compileLoop(context, stmt);
    } else if (stmt instanceof AST.FunctionDeclStmt) {
      this.compileFunction(context, stmt);
    } else if (stmt instanceof AST.PackageDeclStmt) {
      this.compilePackage(context, stmt);
    } else if (stmt instanceof AST.Expr) {
      this.compileExpr(context, stmt as AST.Expr, TypeReq.None);
    }
  }

  private compileIf(context: CompileContext, stmt: AST.IfStmt): void {
    this.compileExpr(context, stmt.condition, TypeReq.Float);
    this.emit(context, this.getOpcodeValue(OpCode.JmpIffNot));
    const jmpIp = context.ip++;
    this.compileBlock(context, stmt.body);
    if (stmt.elseBody) {
      this.emit(context, this.getOpcodeValue(OpCode.Jmp));
      const endJmpIp = context.ip++;
      context.codeStream[jmpIp] = context.ip;
      this.compileBlock(context, stmt.elseBody);
      context.codeStream[endJmpIp] = context.ip;
    } else {
      context.codeStream[jmpIp] = context.ip;
    }
  }

  private compileLoop(context: CompileContext, stmt: AST.LoopStmt): void {
    if (stmt.init) {
      // For loop: generate if (!cond) break; init; do { body; end; } while (cond);
      // This pattern matches what the decompiler's collapseIfLoop expects
      this.compileExpr(context, stmt.condition, TypeReq.Float);
      this.emit(context, this.getOpcodeValue(OpCode.JmpIffNot));
      const breakJmpIp = context.ip++;
      // Init goes inside the conditional block (after the JmpIffNot)
      this.compileExpr(context, stmt.init, TypeReq.None);
      // Fall through to body start
      const bodyStart = context.ip;
      const savedBreak = context.breakPoint, savedCont = context.continuePoint;
      context.breakPoint = 0; context.continuePoint = 0;
      this.compileBlock(context, stmt.body);
      context.continuePoint = context.ip;
      if (stmt.end) this.compileExpr(context, stmt.end, TypeReq.None);
      // Condition check at the bottom of the loop
      this.compileExpr(context, stmt.condition, TypeReq.Float);
      this.emit(context, this.getOpcodeValue(OpCode.JmpIff), bodyStart);
      context.codeStream[breakJmpIp] = context.ip;
      context.breakPoint = savedBreak; context.continuePoint = savedCont;
    } else {
      // While loop: generate pattern that decompiler can recognize
      // condition; JmpIffNot → break; body; condition; JmpIff → body_start; break:
      // This creates Conditional block containing Loop block
      this.compileExpr(context, stmt.condition, TypeReq.Float);
      this.emit(context, this.getOpcodeValue(OpCode.JmpIffNot));
      const breakJmpIp = context.ip++;
      const bodyStart = context.ip;
      const savedBreak = context.breakPoint, savedCont = context.continuePoint;
      context.breakPoint = 0; context.continuePoint = 0;
      this.compileBlock(context, stmt.body);
      context.continuePoint = context.ip;
      // Condition check at the bottom
      this.compileExpr(context, stmt.condition, TypeReq.Float);
      this.emit(context, this.getOpcodeValue(OpCode.JmpIff), bodyStart);
      context.codeStream[breakJmpIp] = context.ip;
      context.breakPoint = savedBreak; context.continuePoint = savedCont;
    }
  }

  private compileFunction(context: CompileContext, fn: AST.FunctionDeclStmt): void {
    const prevS = this.currentStringTable, prevF = this.currentFloatTable;
    this.currentStringTable = this.functionStringTable;
    this.currentFloatTable = this.functionFloatTable;
    this.inFunction = true;
    const start = context.ip;
    this.emit(context, this.getOpcodeValue(OpCode.FuncDecl));
    // Write string index directly at operand position (like TGE14 compiler)
    const nameIdx = this.globalStringTable.add(fn.functionName.literal, false, false);
    context.codeStream[context.ip] = nameIdx;
    this.identTable.add(this.globalStringTable, fn.functionName.literal, context.ip);
    context.ip++;
    // Namespace
    const nsIdx = fn.namespace ? this.globalStringTable.add(fn.namespace.literal, false, false) : 0;
    context.codeStream[context.ip] = nsIdx;
    if (fn.namespace) this.identTable.add(this.globalStringTable, fn.namespace.literal, context.ip);
    context.ip++;
    // Package
    const pkgIdx = fn.packageName ? this.globalStringTable.add(fn.packageName.literal, false, false) : 0;
    context.codeStream[context.ip] = pkgIdx;
    if (fn.packageName) this.identTable.add(this.globalStringTable, fn.packageName.literal, context.ip);
    context.ip++;
    this.emit(context, fn.stmts.length > 0 ? 1 : 0);
    const endJmpIp = context.ip++;
    this.emit(context, fn.args.length);
    for (const arg of fn.args) {
      const strIdx = this.globalStringTable.add((arg.vtype === VarType.Global ? '$' : '%') + arg.name.literal, false, false);
      context.codeStream[context.ip] = strIdx;
      this.identTable.add(this.globalStringTable, (arg.vtype === VarType.Global ? '$' : '%') + arg.name.literal, context.ip);
      context.ip++;
    }
    const savedBreak = context.breakPoint, savedCont = context.continuePoint;
    context.breakPoint = 0; context.continuePoint = 0;
    this.compileBlock(context, fn.stmts);
    context.breakPoint = savedBreak; context.continuePoint = savedCont;
    this.emit(context, this.getOpcodeValue(OpCode.Return));
    context.codeStream[endJmpIp] = context.ip;
    this.inFunction = false;
    this.currentStringTable = prevS;
    this.currentFloatTable = prevF;
  }

  private compilePackage(context: CompileContext, pkg: AST.PackageDeclStmt): void {
    // Compile each function in the package
    for (const fn of pkg.functions) {
      fn.packageName = pkg.name;
      this.compileFunction(context, fn);
    }
  }

  // --- Expression compilation ---
  private compileExpr(context: CompileContext, expr: AST.Expr, typeReq: TypeReq): void {
    if (expr instanceof AST.IntExpr) this.compileIntExpr(context, expr, typeReq);
    else if (expr instanceof AST.FloatExpr) this.compileFloatExpr(context, expr, typeReq);
    else if (expr instanceof AST.StringConstExpr) this.compileStringExpr(context, expr, typeReq);
    else if (expr instanceof AST.ConstantExpr) this.compileConstantExpr(context, expr, typeReq);
    else if (expr instanceof AST.FloatBinaryExpr) this.compileFloatBinary(context, expr, typeReq);
    else if (expr instanceof AST.IntBinaryExpr) this.compileIntBinary(context, expr, typeReq);
    else if (expr instanceof AST.StrCatExpr) this.compileStrCat(context, expr, typeReq);
    else if (expr instanceof AST.StrEqExpr) this.compileStrEq(context, expr, typeReq);
    else if (expr instanceof AST.VarExpr) this.compileVarExpr(context, expr, typeReq);
    else if (expr instanceof AST.AssignExpr) this.compileAssign(context, expr, typeReq);
    else if (expr instanceof AST.AssignOpExpr) this.compileAssignOp(context, expr, typeReq);
    else if (expr instanceof AST.FuncCallExpr) this.compileFuncCall(context, expr, typeReq);
    else if (expr instanceof AST.SlotAccessExpr) this.compileSlotAccess(context, expr, typeReq);
    else if (expr instanceof AST.SlotAssignExpr) this.compileSlotAssign(context, expr, typeReq);
    else if (expr instanceof AST.ObjectDeclExpr) this.compileObjectDecl(context, expr, typeReq);
    else if (expr instanceof AST.ParenthesisExpr) this.compileExpr(context, expr.expr, typeReq);
    else if (expr instanceof AST.IntUnaryExpr) this.compileIntUnary(context, expr, typeReq);
    else if (expr instanceof AST.FloatUnaryExpr) this.compileFloatUnary(context, expr, typeReq);
    else if (expr instanceof AST.ConditionalExpr) this.compileConditional(context, expr, typeReq);
  }

  private compileIntExpr(c: CompileContext, e: AST.IntExpr, t: TypeReq): void {
    if (t === TypeReq.None) return;
    if (t === TypeReq.String) { const i = this.currentStringTable.add(String(e.value), true, false); this.emit(c, this.getOpcodeValue(OpCode.LoadImmedStr), i); }
    else if (t === TypeReq.Float) { const i = this.addFloat(e.value); this.emit(c, this.getOpcodeValue(OpCode.LoadImmedFlt), i); }
    else this.emit(c, this.getOpcodeValue(OpCode.LoadImmedUInt), e.value);
  }

  private compileFloatExpr(c: CompileContext, e: AST.FloatExpr, t: TypeReq): void {
    if (t === TypeReq.None) return;
    if (t === TypeReq.String) { const i = this.currentStringTable.add(String(e.value), true, false); this.emit(c, this.getOpcodeValue(OpCode.LoadImmedStr), i); }
    else if (t === TypeReq.Float) { const i = this.addFloat(e.value); this.emit(c, this.getOpcodeValue(OpCode.LoadImmedFlt), i); }
    else this.emit(c, this.getOpcodeValue(OpCode.LoadImmedUInt), e.value | 0);
  }

  private compileStringExpr(c: CompileContext, e: AST.StringConstExpr, t: TypeReq): void {
    if (t === TypeReq.None) return;
    if (t === TypeReq.String) { const i = this.currentStringTable.add(e.value, true, e.tag); this.emit(c, e.tag ? this.getOpcodeValue(OpCode.TagToStr) : this.getOpcodeValue(OpCode.LoadImmedStr), i); }
    else { const v = this.stringToNumber(e.value); if (t === TypeReq.Float) { const i = this.addFloat(v); this.emit(c, this.getOpcodeValue(OpCode.LoadImmedFlt), i); } else this.emit(c, this.getOpcodeValue(OpCode.LoadImmedUInt), v | 0); }
  }

  private compileConstantExpr(c: CompileContext, e: AST.ConstantExpr, t: TypeReq): void {
    if (t === TypeReq.None) return;
    if (t === TypeReq.String) { const i = this.currentStringTable.add(e.name.literal, false, false); this.emit(c, this.getOpcodeValue(OpCode.LoadImmedStr), i); }
    else { const v = this.stringToNumber(e.name.literal); if (t === TypeReq.Float) { const i = this.addFloat(v); this.emit(c, this.getOpcodeValue(OpCode.LoadImmedFlt), i); } else this.emit(c, this.getOpcodeValue(OpCode.LoadImmedUInt), v | 0); }
  }

  private compileFloatBinary(c: CompileContext, e: AST.FloatBinaryExpr, t: TypeReq): void {
    this.compileExpr(c, e.right, TypeReq.Float);
    this.compileExpr(c, e.left, TypeReq.Float);
    this.emit(c, this.getOpcodeValue(this.getFloatBinOp(e.op.type)));
    if (t !== TypeReq.Float) this.emit(c, this.getOpcodeValue(this.conversionOp(TypeReq.Float, t)));
  }

  private compileIntBinary(c: CompileContext, e: AST.IntBinaryExpr, t: TypeReq): void {
    this.compileExpr(c, e.right, TypeReq.Int);
    this.compileExpr(c, e.left, TypeReq.Int);
    this.emit(c, this.getOpcodeValue(this.getIntBinOp(e.op.type)));
    if (t !== TypeReq.Int) this.emit(c, this.getOpcodeValue(this.conversionOp(TypeReq.Int, t)));
  }

  private compileStrCat(c: CompileContext, e: AST.StrCatExpr, t: TypeReq): void {
    this.compileExpr(c, e.left, TypeReq.String);
    if (e.op.type === TokenType.Concat) this.emit(c, this.getOpcodeValue(OpCode.AdvanceStr));
    else { this.emit(c, this.getOpcodeValue(OpCode.AdvanceStrAppendChar)); this.emit(c, e.op.type === TokenType.SpaceConcat ? 32 : e.op.type === TokenType.TabConcat ? 9 : 10); }
    this.compileExpr(c, e.right, TypeReq.String);
    this.emit(c, this.getOpcodeValue(OpCode.RewindStr));
    if (t !== TypeReq.String) this.emit(c, this.getOpcodeValue(this.conversionOp(TypeReq.String, t)));
  }

  private compileStrEq(c: CompileContext, e: AST.StrEqExpr, t: TypeReq): void {
    this.compileExpr(c, e.left, TypeReq.String);
    this.emit(c, this.getOpcodeValue(OpCode.AdvanceStrNul));
    this.compileExpr(c, e.right, TypeReq.String);
    this.emit(c, this.getOpcodeValue(OpCode.CompareStr));
    if (e.op.type === TokenType.StringNotEquals) this.emit(c, this.getOpcodeValue(OpCode.Not));
    if (t !== TypeReq.Int) this.emit(c, this.getOpcodeValue(this.conversionOp(TypeReq.Int, t)));
  }

  private compileVarExpr(c: CompileContext, e: AST.VarExpr, t: TypeReq): void {
    if (t === TypeReq.None) return;
    const prefix = e.vtype === VarType.Global ? '$' : '%';
    const ident = e.namespace ? prefix + e.namespace.literal + '::' + e.name.literal : prefix + e.name.literal;
    if (e.arrayIndex) {
      this.emit(c, this.getOpcodeValue(OpCode.LoadImmedIdent));
      const strIdx = this.currentStringTable.add(ident, false, false);
      c.codeStream[c.ip] = strIdx;
      this.identTable.add(this.currentStringTable, ident, c.ip);
      c.ip++;
      this.emit(c, this.getOpcodeValue(OpCode.AdvanceStr));
      this.compileExpr(c, e.arrayIndex, TypeReq.String);
      this.emit(c, this.getOpcodeValue(OpCode.RewindStr));
      this.emit(c, this.getOpcodeValue(OpCode.SetCurVarArray));
    } else {
      this.emit(c, this.getOpcodeValue(OpCode.SetCurVar));
      const strIdx = this.currentStringTable.add(ident, false, false);
      c.codeStream[c.ip] = strIdx;
      this.identTable.add(this.currentStringTable, ident, c.ip);
      c.ip++;
    }
    if (t === TypeReq.Int) this.emit(c, this.getOpcodeValue(OpCode.LoadVarUInt));
    else if (t === TypeReq.Float) this.emit(c, this.getOpcodeValue(OpCode.LoadVarFlt));
    else this.emit(c, this.getOpcodeValue(OpCode.LoadVarStr));
  }

  private compileAssign(c: CompileContext, e: AST.AssignExpr, t: TypeReq): void {
    const sub = e.expr instanceof AST.IntExpr ? TypeReq.Int : e.expr instanceof AST.FloatExpr ? TypeReq.Float : TypeReq.String;
    this.compileExpr(c, e.expr, sub);
    const ident = e.varExpr.namespace
      ? (e.varExpr.vtype === VarType.Global ? '$' : '%') + e.varExpr.namespace.literal + '::' + e.varExpr.name.literal
      : (e.varExpr.vtype === VarType.Global ? '$' : '%') + e.varExpr.name.literal;
    if (e.varExpr.arrayIndex) {
      if (sub === TypeReq.String) this.emit(c, this.getOpcodeValue(OpCode.AdvanceStr));
      this.emit(c, this.getOpcodeValue(OpCode.LoadImmedIdent));
      const idIp = this.context_ip(c); this.identTable.add(this.currentStringTable, ident, idIp);
      this.emit(c, this.getOpcodeValue(OpCode.AdvanceStr));
      this.compileExpr(c, e.varExpr.arrayIndex!, TypeReq.String);
      this.emit(c, this.getOpcodeValue(OpCode.RewindStr));
      this.emit(c, this.getOpcodeValue(OpCode.SetCurVarArrayCreate));
      if (sub === TypeReq.String) this.emit(c, this.getOpcodeValue(OpCode.TerminateRewindStr));
    } else {
      this.emit(c, this.getOpcodeValue(OpCode.SetCurVarCreate));
      const idIp = this.context_ip(c); this.identTable.add(this.currentStringTable, ident, idIp);
    }
    if (sub === TypeReq.String) this.emit(c, this.getOpcodeValue(OpCode.SaveVarStr));
    else if (sub === TypeReq.Int) this.emit(c, this.getOpcodeValue(OpCode.SaveVarUInt));
    else this.emit(c, this.getOpcodeValue(OpCode.SaveVarFlt));
    if (t !== sub) this.emit(c, this.getOpcodeValue(this.conversionOp(sub, t)));
  }

  private compileAssignOp(c: CompileContext, e: AST.AssignOpExpr, t: TypeReq): void {
    const { subType, operand } = this.getAssignOpInfo(e.op.type);
    if (e.expr) {
      this.compileExpr(c, e.expr, subType);
    } else {
      // Postfix ++/--: push literal 1 as the operand
      this.compileIntExpr(c, new AST.IntExpr(e.lineNo, 1), subType);
    }
    const ident = e.varExpr.namespace
      ? (e.varExpr.vtype === VarType.Global ? '$' : '%') + e.varExpr.namespace.literal + '::' + e.varExpr.name.literal
      : (e.varExpr.vtype === VarType.Global ? '$' : '%') + e.varExpr.name.literal;
    if (e.varExpr.arrayIndex) {
      this.emit(c, this.getOpcodeValue(OpCode.LoadImmedIdent));
      const idIp = this.context_ip(c); this.identTable.add(this.currentStringTable, ident, idIp);
      this.emit(c, this.getOpcodeValue(OpCode.AdvanceStr));
      this.compileExpr(c, e.varExpr.arrayIndex!, TypeReq.String);
      this.emit(c, this.getOpcodeValue(OpCode.RewindStr));
      this.emit(c, this.getOpcodeValue(OpCode.SetCurVarArrayCreate));
    } else {
      this.emit(c, this.getOpcodeValue(OpCode.SetCurVarCreate));
      const idIp = this.context_ip(c); this.identTable.add(this.currentStringTable, ident, idIp);
    }
    this.emit(c, this.getOpcodeValue(subType === TypeReq.Float ? OpCode.LoadVarFlt : OpCode.LoadVarUInt));
    this.emit(c, this.getOpcodeValue(operand));
    this.emit(c, this.getOpcodeValue(subType === TypeReq.Float ? OpCode.SaveVarFlt : OpCode.SaveVarUInt));
    if (t !== subType) this.emit(c, this.getOpcodeValue(this.conversionOp(subType, t)));
  }

  private compileFuncCall(c: CompileContext, e: AST.FuncCallExpr, t: TypeReq): void {
    this.emit(c, this.getOpcodeValue(OpCode.PushFrame));
    // For method calls, push the object as the first argument
    if (e.callType === FuncCallType.MethodCall && e.objectExpr) {
      this.compileExpr(c, e.objectExpr, TypeReq.String);
      this.emit(c, this.getOpcodeValue(OpCode.Push));
    }
    for (const arg of e.args) { this.compileExpr(c, arg, TypeReq.String); this.emit(c, this.getOpcodeValue(OpCode.Push)); }
    this.emit(c, e.callType === FuncCallType.MethodCall || e.callType === FuncCallType.ParentCall ? this.getOpcodeValue(OpCode.CallFunc) : this.getOpcodeValue(OpCode.CallFuncResolve));
    const nameIp = this.context_ip(c); this.identTable.add(this.currentStringTable, e.name.literal, nameIp);
    const nsIp = this.context_ip(c); if (e.namespace) this.identTable.add(this.currentStringTable, e.namespace.literal, nsIp);
    this.emit(c, e.callType as number);
    if (t !== TypeReq.String) this.emit(c, this.getOpcodeValue(this.conversionOp(TypeReq.String, t)));
  }

  private compileSlotAccess(c: CompileContext, e: AST.SlotAccessExpr, t: TypeReq): void {
    if (t === TypeReq.None) return;
    if (e.arrayExpr) { this.compileExpr(c, e.arrayExpr, TypeReq.String); this.emit(c, this.getOpcodeValue(OpCode.AdvanceStr)); }
    this.compileExpr(c, e.objectExpr, TypeReq.String);
    this.emit(c, this.getOpcodeValue(OpCode.SetCurObject));
    this.emit(c, this.getOpcodeValue(OpCode.SetCurField));
    const fIp = this.context_ip(c); this.identTable.add(this.currentStringTable, e.slotName!.literal, fIp);
    if (e.arrayExpr) { this.emit(c, this.getOpcodeValue(OpCode.TerminateRewindStr)); this.emit(c, this.getOpcodeValue(OpCode.SetCurFieldArray)); }
    if (t === TypeReq.Int) this.emit(c, this.getOpcodeValue(OpCode.LoadFieldUInt));
    else if (t === TypeReq.Float) this.emit(c, this.getOpcodeValue(OpCode.LoadFieldFlt));
    else this.emit(c, this.getOpcodeValue(OpCode.LoadFieldStr));
  }

  private compileSlotAssign(c: CompileContext, e: AST.SlotAssignExpr, t: TypeReq): void {
    this.compileExpr(c, e.expr, TypeReq.String);
    this.emit(c, this.getOpcodeValue(OpCode.AdvanceStr));
    if (e.arrayExpr) { this.compileExpr(c, e.arrayExpr, TypeReq.String); this.emit(c, this.getOpcodeValue(OpCode.AdvanceStr)); }
    if (e.objectExpr) { this.compileExpr(c, e.objectExpr, TypeReq.String); this.emit(c, this.getOpcodeValue(OpCode.SetCurObject)); }
    else this.emit(c, this.getOpcodeValue(OpCode.SetCurObjectNew));
    this.emit(c, this.getOpcodeValue(OpCode.SetCurField));
    const fIp = this.context_ip(c); this.identTable.add(this.currentStringTable, e.slotName!.literal, fIp);
    if (e.arrayExpr) { this.emit(c, this.getOpcodeValue(OpCode.TerminateRewindStr)); this.emit(c, this.getOpcodeValue(OpCode.SetCurFieldArray)); }
    this.emit(c, this.getOpcodeValue(OpCode.TerminateRewindStr));
    this.emit(c, this.getOpcodeValue(OpCode.SaveFieldStr));
    if (t !== TypeReq.String) this.emit(c, this.getOpcodeValue(this.conversionOp(TypeReq.String, t)));
  }

  private compileObjectDecl(c: CompileContext, e: AST.ObjectDeclExpr, t: TypeReq): void {
    this.compileSubObject(c, e, true);
    if (t !== TypeReq.Int) this.emit(c, this.getOpcodeValue(this.conversionOp(TypeReq.Int, t)));
  }

  private compileSubObject(c: CompileContext, e: AST.ObjectDeclExpr, root: boolean): void {
    const start = c.ip;
    this.emit(c, this.getOpcodeValue(OpCode.PushFrame));
    // Class name: emit LoadImmedIdent + ident table entry
    const classNameExpr = e.className as AST.ConstantExpr;
    const classStrIdx = this.currentStringTable.add(classNameExpr.name.literal, false, false);
    this.emit(c, this.getOpcodeValue(OpCode.LoadImmedIdent));
    const classIp = this.context_ip(c);
    this.identTable.add(this.currentStringTable, classNameExpr.name.literal, classIp);
    this.emit(c, this.getOpcodeValue(OpCode.Push));
    // Object name: emit LoadImmedIdent + ident table entry
    if (e.objectNameExpr instanceof AST.ConstantExpr) {
      this.emit(c, this.getOpcodeValue(OpCode.LoadImmedIdent));
      const objIp = this.context_ip(c);
      const objNameExpr = e.objectNameExpr as AST.ConstantExpr;
      this.identTable.add(this.currentStringTable, objNameExpr.name.literal, objIp);
    } else {
      this.compileExpr(c, e.objectNameExpr, TypeReq.String);
    }
    this.emit(c, this.getOpcodeValue(OpCode.Push));
    for (const arg of e.args) { this.compileExpr(c, arg, TypeReq.String); this.emit(c, this.getOpcodeValue(OpCode.Push)); }
    this.emit(c, this.getOpcodeValue(OpCode.CreateObject));
    const pIp = this.context_ip(c); if (e.parentObject) this.identTable.add(this.currentStringTable, e.parentObject.literal, pIp);
    this.emit(c, e.structDecl ? 1 : 0);
    const failIp = this.context_ip(c);
    for (const slot of e.slotDecls) this.compileExpr(c, slot, TypeReq.None);
    this.emit(c, this.getOpcodeValue(OpCode.AddObject));
    this.emit(c, root ? 1 : 0);
    for (const sub of e.subObjects) this.compileSubObject(c, sub, false);
    this.emit(c, this.getOpcodeValue(OpCode.EndObject));
    this.emit(c, (root || e.structDecl) ? 1 : 0);
    c.codeStream[failIp] = c.ip;
  }

  private compileIntUnary(c: CompileContext, e: AST.IntUnaryExpr, t: TypeReq): void {
    this.compileExpr(c, e.expr, TypeReq.Int);
    if (e.op.type === TokenType.Not) this.emit(c, this.getOpcodeValue(OpCode.Not));
    else if (e.op.type === TokenType.Tilde) this.emit(c, this.getOpcodeValue(OpCode.OnesComplement));
    if (t !== TypeReq.Int) this.emit(c, this.getOpcodeValue(this.conversionOp(TypeReq.Int, t)));
  }

  private compileFloatUnary(c: CompileContext, e: AST.FloatUnaryExpr, t: TypeReq): void {
    this.compileExpr(c, e.expr, TypeReq.Float);
    this.emit(c, this.getOpcodeValue(OpCode.Neg));
    if (t !== TypeReq.Float) this.emit(c, this.getOpcodeValue(this.conversionOp(TypeReq.Float, t)));
  }

  private compileConditional(c: CompileContext, e: AST.ConditionalExpr, t: TypeReq): void {
    this.compileExpr(c, e.condition, TypeReq.Int);
    this.emit(c, this.getOpcodeValue(OpCode.JmpIfNot));
    const elseJmpIp = c.ip++;
    this.compileExpr(c, e.trueExpr, t);
    this.emit(c, this.getOpcodeValue(OpCode.Jmp));
    const endJmpIp = c.ip++;
    c.codeStream[elseJmpIp] = c.ip;
    this.compileExpr(c, e.falseExpr, t);
    c.codeStream[endJmpIp] = c.ip;
  }

  // --- Helpers ---
  private emit(c: any, ...ops: number[]): void {
    const invalid = this.ops.invalid;
    for (const op of ops) {
      c.codeStream[c.ip++] = op === invalid ? this.getOpcodeValue(OpCode.Return) : op;
    }
  }

  private context_ip(c: CompileContext): number { const ip = c.ip; c.ip++; return ip; }

  private addBreakLine(c: CompileContext, lineNo: number): void {
    if (this.inFunction) {
      const line = this.breakLineCount * 2;
      this.breakLineCount++;
      if (c.lineBreakPairs.length > 0) { c.lineBreakPairs[line] = lineNo; c.lineBreakPairs[line + 1] = c.ip; }
    }
  }

  private stringToNumber(value: string): number {
    if (value === 'true') return 1;
    if (value === 'false') return 0;
    const v = parseFloat(value);
    return isNaN(v) ? 0 : v;
  }

  private addFloat(value: number): number {
    const idx = this.currentFloatTable.indexOf(value);
    if (idx >= 0) return idx;
    this.currentFloatTable.push(value);
    return this.currentFloatTable.length - 1;
  }

  private getFloatBinOp(tt: TokenType): OpCode {
    switch (tt) { case TokenType.Plus: return OpCode.Add; case TokenType.Minus: return OpCode.Sub; case TokenType.Multiply: return OpCode.Mul; case TokenType.Divide: return OpCode.Div; default: return OpCode.Invalid; }
  }

  private getIntBinOp(tt: TokenType): OpCode {
    switch (tt) {
      case TokenType.BitwiseXor: return OpCode.Xor; case TokenType.Modulus: return OpCode.Mod;
      case TokenType.BitwiseAnd: return OpCode.BitAnd; case TokenType.BitwiseOr: return OpCode.BitOr;
      case TokenType.LessThan: return OpCode.CmpLT; case TokenType.LessThanEqual: return OpCode.CmpLE;
      case TokenType.GreaterThan: return OpCode.CmpGT; case TokenType.GreaterThanEqual: return OpCode.CmpGE;
      case TokenType.Equal: return OpCode.CmpEQ; case TokenType.NotEqual: return OpCode.CmpNE;
      case TokenType.LogicalOr: return OpCode.Or; case TokenType.LogicalAnd: return OpCode.And;
      case TokenType.RightBitShift: return OpCode.Shr; case TokenType.LeftBitShift: return OpCode.Shl;
      default: return OpCode.Invalid;
    }
  }

  private getAssignOpInfo(tt: TokenType): { subType: TypeReq; operand: OpCode } {
    switch (tt) {
      case TokenType.PlusAssign: return { subType: TypeReq.Float, operand: OpCode.Add };
      case TokenType.MinusAssign: return { subType: TypeReq.Float, operand: OpCode.Sub };
      case TokenType.MultiplyAssign: return { subType: TypeReq.Float, operand: OpCode.Mul };
      case TokenType.DivideAssign: return { subType: TypeReq.Float, operand: OpCode.Div };
      case TokenType.ModulusAssign: return { subType: TypeReq.Int, operand: OpCode.Mod };
      case TokenType.AndAssign: return { subType: TypeReq.Int, operand: OpCode.BitAnd };
      case TokenType.XorAssign: return { subType: TypeReq.Int, operand: OpCode.Xor };
      case TokenType.OrAssign: return { subType: TypeReq.Int, operand: OpCode.BitOr };
      case TokenType.ShiftLeftAssign: return { subType: TypeReq.Int, operand: OpCode.Shl };
      case TokenType.ShiftRightAssign: return { subType: TypeReq.Int, operand: OpCode.Shr };
      case TokenType.PlusPlus: return { subType: TypeReq.Float, operand: OpCode.Add };
      case TokenType.MinusMinus: return { subType: TypeReq.Float, operand: OpCode.Sub };
      default: return { subType: TypeReq.Int, operand: OpCode.Invalid };
    }
  }

  private conversionOp(src: TypeReq, dest: TypeReq): OpCode {
    if (src === TypeReq.String && dest === TypeReq.Int) return OpCode.StrToUInt;
    if (src === TypeReq.String && dest === TypeReq.Float) return OpCode.StrToFlt;
    if (src === TypeReq.String && dest === TypeReq.None) return OpCode.StrToNone;
    if (src === TypeReq.Float && dest === TypeReq.Int) return OpCode.FltToUInt;
    if (src === TypeReq.Float && dest === TypeReq.String) return OpCode.FltToStr;
    if (src === TypeReq.Float && dest === TypeReq.None) return OpCode.FltToNone;
    if (src === TypeReq.Int && dest === TypeReq.Float) return OpCode.UIntToFlt;
    if (src === TypeReq.Int && dest === TypeReq.String) return OpCode.UIntToStr;
    if (src === TypeReq.Int && dest === TypeReq.None) return OpCode.UIntToNone;
    return OpCode.Invalid;
  }

  // --- Binary serialization (DSO format) ---
  private serialize(context: CompileContext, codeSize: number, lineBreakPairCount: number): Uint8Array {
    const buf = new ArrayBuffer(1024 * 1024); // 1MB max
    const view = new DataView(buf);
    let pos = 0;

    const writeU32 = (v: number) => { view.setUint32(pos, v, true); pos += 4; };
    const writeF64 = (v: number) => { view.setFloat64(pos, v, true); pos += 8; };
    const writeBytes = (bytes: number[]) => { for (const b of bytes) { view.setUint8(pos++, b); } };

    // 1. DSO version
    writeU32(this.dsoVersion);

    // 2. Global string table: u32 totalLen, then raw string bytes
    writeU32(this.globalStringTable.totalLen);
    for (const entry of this.globalStringTable.entries) {
      for (let i = 0; i < entry.string.length; i++) view.setUint8(pos++, entry.string.charCodeAt(i));
      view.setUint8(pos++, 0); // null terminator
      for (let i = entry.string.length + 1; i < entry.len; i++) view.setUint8(pos++, 0); // padding
    }

    // 3. Global float table: u32 count, then count * f64
    writeU32(this.globalFloatTable.length);
    for (const f of this.globalFloatTable) writeF64(f);

    // 4. Function string table
    writeU32(this.functionStringTable.totalLen);
    for (const entry of this.functionStringTable.entries) {
      for (let i = 0; i < entry.string.length; i++) view.setUint8(pos++, entry.string.charCodeAt(i));
      view.setUint8(pos++, 0);
      for (let i = entry.string.length + 1; i < entry.len; i++) view.setUint8(pos++, 0);
    }

    // 5. Function float table
    writeU32(this.functionFloatTable.length);
    for (const f of this.functionFloatTable) writeF64(f);

    // 6. Code size
    writeU32(codeSize);

    // 7. Line break pair count (decompiler reads this as lineBreaks, then reads lineBreaks*2 values)
    writeU32(lineBreakPairCount / 2);

    // 8. Code stream — write using readOp-compatible format
    for (let i = 0; i < codeSize; i++) {
      const v = context.codeStream[i];
      if (v <= 0xFF) view.setUint8(pos++, v);
      else { view.setUint8(pos++, 0xFF); view.setUint32(pos, v, true); pos += 4; }
    }

    // 9. Line break pairs
    for (let i = 0; i < lineBreakPairCount; i++) writeU32(context.lineBreakPairs[i]);

    // 10. Identifier table
    writeU32(this.identTable.identMap.size);
    for (const [strIdx, positions] of this.identTable.identMap) {
      writeU32(strIdx);
      writeU32(positions.length);
      for (const p of positions) writeU32(p);
    }

    return new Uint8Array(buf, 0, pos);
  }
}
