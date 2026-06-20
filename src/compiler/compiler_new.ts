// compiler.ts — TorqueScript compiler: AST -> bytecode for any dso-sharp target
// Based on Torque Game Engine compiler.cc (console/compiler.cc)
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
opcodeNameMap[OpCode.ProcessArgs] = 'OP_PROCESS_ARGS';
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
      // Matches real Torque engine: initSize + testSize + 2 + blockSize + endSize + testSize + 2
      return initSize + testSize + 2 + blockSize + endSize + testSize + 2;
    }
    if (stmt instanceof AST.FunctionDeclStmt) {
      this.breakLineCount++;
      return this.precompileFunction(stmt);
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
      return this.precompileExpr(expr.objectExpr, TypeReq.String) + 4 +
             (expr.arrayExpr ? this.precompileExpr(expr.arrayExpr, TypeReq.String) + 4 : 0);
    }
    if (expr instanceof AST.SlotAssignExpr) {
      return this.precompileExpr(expr.expr, TypeReq.String) + 6 +
             (expr.arrayExpr ? this.precompileExpr(expr.arrayExpr, TypeReq.String) + 4 : 0) +
             (expr.objectExpr ? this.precompileExpr(expr.objectExpr, TypeReq.String) + 1 : 0);
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
    // Matches real Torque engine ObjectDeclNode::precompileSubObject
    // OP_LOADIMMED_UINT + compileSubObject
    let size = 2; // root object: LoadImmedUInt(0)
    size += this.precompileSubObject(expr);
    return size;
  }

  private precompileSubObject(expr: AST.ObjectDeclExpr): number {
    // Matches real Torque engine: 10 + nameSize + argSize + slotSize + subObjSize
    // Fixed slots: OP_PUSH_FRAME, OP_PUSH(after className), OP_PUSH(after objectName),
    //   OP_CREATE_OBJECT, parentObject, structDecl, failPoint, OP_ADD_OBJECT, root,
    //   OP_END_OBJECT, root||structDecl = 10 + 1 (OP_PUSH after className is in argSize)
    // Actually: OP_PUSH_FRAME(1) + OP_PUSH after objName(1) + OP_CREATE_OBJECT(1) +
    //   parentObject(1) + structDecl(1) + failPoint(1) + OP_ADD_OBJECT(1) + root(1) +
    //   OP_END_OBJECT(1) + root||structDecl(1) = 10 fixed
    // OP_PUSH after className is counted in argSize
    let size = 10;
    size += this.precompileExpr(expr.className, TypeReq.String) + 1; // className + OP_PUSH
    size += this.precompileExpr(expr.objectNameExpr, TypeReq.String); // objectName (no +1!)
    for (const arg of expr.args) size += this.precompileExpr(arg, TypeReq.String) + 1;
    for (const slot of expr.slotDecls) size += this.precompileExpr(slot, TypeReq.None);
    for (const sub of expr.subObjects) size += this.precompileSubObject(sub);
    return size;
  }

  private precompileFunction(fn: AST.FunctionDeclStmt): number {
    const prevS = this.currentStringTable, prevF = this.currentFloatTable;
    this.currentStringTable = this.functionStringTable;
    this.currentFloatTable = this.functionFloatTable;
    const bodySize = this.precompileBlock(fn.stmts, 0);
    this.currentStringTable = prevS;
    this.currentFloatTable = prevF;
    // Matches real Torque: endOffset = argc + subSize + 8
    // 8 = OP_FUNC_DECL + name + ns + pkg + hasBody + endAddr + argc + OP_RETURN
    return fn.args.length + bodySize + 8;
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
    const start = context.ip;
    if (stmt.init) this.compileExpr(context, stmt.init, TypeReq.None);
    this.compileExpr(context, stmt.condition, TypeReq.Float);
    this.emit(context, this.getOpcodeValue(OpCode.JmpIffNot));
    const breakJmpIp = context.ip++;
    const savedBreak = context.breakPoint, savedCont = context.continuePoint;
    context.breakPoint = 0; context.continuePoint = 0;
    this.compileBlock(context, stmt.body);
    context.continuePoint = context.ip;
    if (stmt.end) this.compileExpr(context, stmt.end, TypeReq.None);
    this.compileExpr(context, stmt.condition, TypeReq.Float);
    this.emit(context, this.getOpcodeValue(OpCode.JmpIff), start);
    context.codeStream[breakJmpIp] = context.ip;
    context.breakPoint = savedBreak; context.continuePoint = savedCont;
  }

  private compileFunction(context: CompileContext, fn: AST.FunctionDeclStmt): void {
    const prevS = this.currentStringTable, prevF = this.currentFloatTable;
    this.currentStringTable = this.functionStringTable;
    this.currentFloatTable = this.functionFloatTable;
    this.inFunction = true;
    const start = context.ip;
    this.emit(context, this.getOpcodeValue(OpCode.FuncDecl));
    // Exact layout matching real Torque engine FunctionDeclStmtNode::compileStmt:
    // ip+0: OP_FUNC_DECL
    // ip+1: name (STEtoU32)
    // ip+2: namespace (STEtoU32)
    // ip+3: package (STEtoU32)
    // ip+4: hasBody
    // ip+5: endAddress
    // ip+6: argc
    // ip+7+: arg identifiers
    const nameIp = context.ip++;
    this.identTable.add(this.currentStringTable, fn.functionName.literal, nameIp);
    const nsIp = context.ip++;
    if (fn.namespace) this.identTable.add(this.currentStringTable, fn.namespace.literal, nsIp);
    const pkgIp = context.ip++;
    if (fn.packageName) this.identTable.add(this.currentStringTable, fn.packageName.literal, pkgIp);
    this.emit(context, fn.stmts.length > 0 ? 1 : 0);
    const endJmpIp = context.ip++;
    this.emit(context, fn.args.length);
    for (const arg of fn.args) {
      const argIp = context.ip++;
      this.identTable.add(this.currentStringTable, (arg.vtype === VarType.Global ? '$' : '%') + arg.name.literal, argIp);
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
