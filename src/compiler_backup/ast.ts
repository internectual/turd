// ast.ts — AST node types for TorqueScript compiler

import { Token } from './scanner';

export enum TypeReq { None, Int, Float, String }
export enum VarType { Global, Local }
export enum FuncCallType { FunctionCall, MethodCall, ParentCall }

// Base classes
export abstract class Stmt {
  lineNo: number;
  constructor(lineNo: number) { this.lineNo = lineNo; }
}

export abstract class Expr extends Stmt {
  constructor(lineNo: number) { super(lineNo); }
}

// Statements
export class BreakStmt extends Stmt {
  constructor(lineNo: number) { super(lineNo); }
}

export class ContinueStmt extends Stmt {
  constructor(lineNo: number) { super(lineNo); }
}

export class ReturnStmt extends Stmt {
  expr: Expr | null;
  constructor(lineNo: number, expr: Expr | null) { super(lineNo); this.expr = expr; }
}

export class IfStmt extends Stmt {
  condition: Expr;
  body: Stmt[];
  elseBody: Stmt[] | null;
  constructor(lineNo: number, condition: Expr, body: Stmt[], elseBody: Stmt[] | null) {
    super(lineNo); this.condition = condition; this.body = body; this.elseBody = elseBody;
  }
}

export class LoopStmt extends Stmt {
  condition: Expr;
  init: Expr | null;
  end: Expr | null;
  body: Stmt[];
  constructor(lineNo: number, condition: Expr, init: Expr | null, end: Expr | null, body: Stmt[]) {
    super(lineNo); this.condition = condition; this.init = init; this.end = end; this.body = body;
  }
}

export class FunctionDeclStmt extends Stmt {
  functionName: Token;
  packageName: Token | null;
  args: VarExpr[];
  stmts: Stmt[];
  namespace: Token | null;
  constructor(functionName: Token, args: VarExpr[], stmts: Stmt[], namespace: Token | null) {
    super(functionName.line);
    this.functionName = functionName;
    this.packageName = null;
    this.args = args;
    this.stmts = stmts;
    this.namespace = namespace;
  }
}

// Expressions
export class ParenthesisExpr extends Expr {
  expr: Expr;
  constructor(expr: Expr) { super(expr.lineNo); this.expr = expr; }
}

export class FloatBinaryExpr extends Expr {
  left: Expr;
  right: Expr;
  op: Token;
  constructor(left: Expr, right: Expr, op: Token) {
    super(left.lineNo); this.left = left; this.right = right; this.op = op;
  }
}

export class IntBinaryExpr extends Expr {
  left: Expr;
  right: Expr;
  op: Token;
  constructor(left: Expr, right: Expr, op: Token) {
    super(left.lineNo); this.left = left; this.right = right; this.op = op;
  }
}

export class StrEqExpr extends Expr {
  left: Expr;
  right: Expr;
  op: Token;
  constructor(left: Expr, right: Expr, op: Token) {
    super(left.lineNo); this.left = left; this.right = right; this.op = op;
  }
}

export class StrCatExpr extends Expr {
  left: Expr;
  right: Expr;
  op: Token;
  constructor(left: Expr, right: Expr, op: Token) {
    super(left.lineNo); this.left = left; this.right = right; this.op = op;
  }
}

export class CommaCatExpr extends Expr {
  left: Expr;
  right: Expr;
  constructor(left: Expr, right: Expr) {
    super(left.lineNo); this.left = left; this.right = right;
  }
}

export class ConditionalExpr extends Expr {
  condition: Expr;
  trueExpr: Expr;
  falseExpr: Expr;
  constructor(condition: Expr, trueExpr: Expr, falseExpr: Expr) {
    super(condition.lineNo); this.condition = condition; this.trueExpr = trueExpr; this.falseExpr = falseExpr;
  }
}

export class IntUnaryExpr extends Expr {
  expr: Expr;
  op: Token;
  constructor(expr: Expr, op: Token) { super(expr.lineNo); this.expr = expr; this.op = op; }
}

export class FloatUnaryExpr extends Expr {
  expr: Expr;
  op: Token;
  constructor(expr: Expr, op: Token) { super(expr.lineNo); this.expr = expr; this.op = op; }
}

export class VarExpr extends Expr {
  name: Token;
  arrayIndex: Expr | null;
  vtype: VarType;
  constructor(name: Token, arrayIndex: Expr | null, vtype: VarType) {
    super(name.line); this.name = name; this.arrayIndex = arrayIndex; this.vtype = vtype;
  }
}

export class IntExpr extends Expr {
  value: number;
  constructor(lineNo: number, value: number) { super(lineNo); this.value = value; }
}

export class FloatExpr extends Expr {
  value: number;
  constructor(lineNo: number, value: number) { super(lineNo); this.value = value; }
}

export class StringConstExpr extends Expr {
  value: string;
  tag: boolean;
  constructor(lineNo: number, value: string, tag: boolean) { super(lineNo); this.value = value; this.tag = tag; }
}

export class ConstantExpr extends Expr {
  name: Token;
  constructor(name: Token) { super(name.line); this.name = name; }
}

export class AssignExpr extends Expr {
  varExpr: VarExpr;
  expr: Expr;
  constructor(varExpr: VarExpr, expr: Expr) { super(varExpr.lineNo); this.varExpr = varExpr; this.expr = expr; }
}

export class AssignOpExpr extends Expr {
  varExpr: VarExpr;
  expr: Expr;
  op: Token;
  constructor(varExpr: VarExpr, expr: Expr, op: Token) {
    super(varExpr.lineNo); this.varExpr = varExpr; this.expr = expr; this.op = op;
  }
}

export class FuncCallExpr extends Expr {
  name: Token;
  namespace: Token | null;
  args: Expr[];
  callType: FuncCallType;
  constructor(name: Token, namespace: Token | null, args: Expr[], callType: FuncCallType) {
    super(name.line); this.name = name; this.namespace = namespace; this.args = args; this.callType = callType;
  }
}

export class SlotAccessExpr extends Expr {
  objectExpr: Expr;
  arrayExpr: Expr | null;
  slotName: Token;
  constructor(objectExpr: Expr, arrayExpr: Expr | null, slotName: Token) {
    super(objectExpr.lineNo); this.objectExpr = objectExpr; this.arrayExpr = arrayExpr; this.slotName = slotName;
  }
}

export class SlotAssignExpr extends Expr {
  objectExpr: Expr | null;
  arrayExpr: Expr | null;
  slotName: Token;
  expr: Expr;
  constructor(objectExpr: Expr | null, arrayExpr: Expr | null, slotName: Token, expr: Expr) {
    super(slotName.line); this.objectExpr = objectExpr; this.arrayExpr = arrayExpr; this.slotName = slotName; this.expr = expr;
  }
}

export class SlotAssignOpExpr extends Expr {
  objectExpr: Expr;
  arrayExpr: Expr | null;
  slotName: Token;
  expr: Expr;
  op: Token;
  constructor(objectExpr: Expr, arrayExpr: Expr | null, slotName: Token, expr: Expr, op: Token) {
    super(objectExpr.lineNo); this.objectExpr = objectExpr; this.arrayExpr = arrayExpr;
    this.slotName = slotName; this.expr = expr; this.op = op;
  }
}

export class ObjectDeclExpr extends Expr {
  className: Expr;
  parentObject: Token | null;
  objectNameExpr: Expr;
  args: Expr[];
  slotDecls: SlotAssignExpr[];
  subObjects: ObjectDeclExpr[];
  structDecl: boolean;
  constructor(className: Expr, parentObject: Token | null, objectNameExpr: Expr,
    args: Expr[], slotDecls: SlotAssignExpr[], subObjects: ObjectDeclExpr[], structDecl: boolean) {
    super(className.lineNo); this.className = className; this.parentObject = parentObject;
    this.objectNameExpr = objectNameExpr; this.args = args; this.slotDecls = slotDecls;
    this.subObjects = subObjects; this.structDecl = structDecl;
  }
}
