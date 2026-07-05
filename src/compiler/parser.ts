// parser.ts — TorqueScript recursive descent parser

import { Token, TokenType, Scanner, makeToken } from './scanner';
import * as AST from './ast';
import { TypeReq, VarType, FuncCallType } from './ast';

export class SyntaxError extends Error {
  token: Token;
  constructor(message: string, token: Token) {
    super(`${message} at line ${token.line}`);
    this.token = token;
  }
}

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    // Filter out comments
    this.tokens = tokens.filter(t => t.type !== TokenType.Comment);
  }

  parse(): AST.Stmt[] {
    const stmts: AST.Stmt[] = [];
    let consecutiveErrors = 0;
    while (!this.isAtEnd()) {
      try {
        const s = this.decl();
        if (s) stmts.push(s);
        consecutiveErrors = 0;
      } catch (e) {
        consecutiveErrors++;
        // Fast error recovery: skip to next function/package/} boundary
        if (consecutiveErrors > 5) {
          // Many consecutive errors — skip to next function keyword directly
          while (!this.isAtEnd()) {
            if (this.check(TokenType.Function) || this.check(TokenType.Package) ||
                this.check(TokenType.Eof)) break;
            this.advance();
          }
        } else {
          while (!this.isAtEnd()) {
            if (this.check(TokenType.RBracket) || this.check(TokenType.Function) ||
                this.check(TokenType.Package) || this.check(TokenType.Eof)) break;
            this.advance();
          }
        }
        if (!this.isAtEnd()) this.advance();
      }
    }
    return stmts;
  }

  private decl(): AST.Stmt | null {
    // Check for package
    if (this.match(TokenType.Package)) {
      return this.packageDecl();
    }
    // Check for function
    const fn = this.functionDecl();
    if (fn) return fn;
    return this.stmt();
  }

  private packageDecl(): AST.Stmt {
    const name = this.consume(TokenType.Label, 'Expected package name');
    this.consume(TokenType.LBracket, "Expected '{' after package name");
    // For simplicity, just parse function declarations inside
    const fns: AST.FunctionDeclStmt[] = [];
    while (this.check(TokenType.Function)) {
      const fn = this.functionDecl();
      if (fn) {
        fn.packageName = name;
        fns.push(fn);
      }
    }
    this.consume(TokenType.RBracket, "Expected '}' after package body");
    this.tryConsume(TokenType.Semicolon);
    return new AST.PackageDeclStmt(name, fns);
  }

  private functionDecl(): AST.FunctionDeclStmt | null {
    if (!this.match(TokenType.Function)) return null;
    const fnName = this.consume(TokenType.Label, 'Expected function name');
    let namespace: Token | null = null;
    if (this.match(TokenType.DoubleColon)) {
      namespace = fnName;
      this.consume(TokenType.Label, 'Expected function name after ::');
    }
    this.consume(TokenType.LParen, "Expected '(' after function name");
    const args: AST.VarExpr[] = [];
    if (!this.check(TokenType.RParen)) {
      const v = this.variable();
      if (v) args.push(v);
      while (this.match(TokenType.Comma)) {
        const v2 = this.variable();
        if (v2) args.push(v2);
      }
    }
    this.consume(TokenType.RParen, "Expected ')' after parameters");
    this.consume(TokenType.LBracket, "Expected '{' before function body");
    const body = this.statementList();
    this.consume(TokenType.RBracket, "Expected '}' after function body");
    return new AST.FunctionDeclStmt(fnName, args, body, namespace);
  }

  private variable(): AST.VarExpr | null {
    if (this.match(TokenType.Dollar) || this.match(TokenType.Modulus)) {
      const isGlobal = this.previous().type === TokenType.Dollar;
      return this.parseVariableNameToken(isGlobal);
    }
    return null;
  }

  private parseVariableNameToken(isGlobal: boolean): AST.VarExpr {
    const nextToken = this.peek();
    const canBeName =
      nextToken.type === TokenType.Label ||
      nextToken.type === TokenType.Int ||
      nextToken.type === TokenType.Float ||
      (nextToken.type >= TokenType.Datablock && nextToken.type <= TokenType.Default) ||
      nextToken.type === TokenType.Continue ||
      nextToken.type === TokenType.Or;

    if (canBeName) {
      let nameToken = this.advance();
      if (nameToken.literal === null || nameToken.literal === undefined) {
        nameToken = {
          ...nameToken,
          literal: nameToken.lexeme
        };
      } else {
        nameToken = {
          ...nameToken,
          literal: String(nameToken.literal)
        };
      }
      return new AST.VarExpr(nameToken, null, null, isGlobal ? VarType.Global : VarType.Local);
    }
    throw new SyntaxError('Expected variable name', nextToken);
  }

  private parseArrayIndex(): AST.Expr {
    let expr = this.expression();
    const line = this.previous().line;
    const concatOp = { type: TokenType.Concat, lexeme: "@", literal: null, line: line, position: 0 };
    while (this.match(TokenType.Comma)) {
      const right = this.expression();
      const underscore = new AST.StringConstExpr(line, "_", false);
      const intermediate = new AST.StrCatExpr(expr, underscore, concatOp);
      expr = new AST.StrCatExpr(intermediate, right, concatOp);
    }
    return expr;
  }

  private statementList(): AST.Stmt[] {
    const stmts: AST.Stmt[] = [];
    while (!this.check(TokenType.RBracket) && !this.isAtEnd() &&
           !this.check(TokenType.Case) && !this.check(TokenType.Default)) {
      const s = this.stmt();
      if (s) stmts.push(s);
    }
    return stmts;
  }

  private stmt(): AST.Stmt | null {
    if (this.check(TokenType.Break)) return this.breakStmt();
    if (this.check(TokenType.Continue)) return this.continueStmt();
    if (this.check(TokenType.Return)) return this.returnStmt();
    if (this.check(TokenType.If)) return this.ifStmt();
    if (this.check(TokenType.While)) return this.whileStmt();
    if (this.check(TokenType.For)) return this.forStmt();
    if (this.check(TokenType.Switch)) return this.switchStmt();
    if (this.check(TokenType.Datablock)) return this.datablockStmt();
    return this.expressionStmt();
  }

  private breakStmt(): AST.BreakStmt {
    const line = this.peek().line;
    this.advance();
    this.consume(TokenType.Semicolon, "Expected ';' after break");
    return new AST.BreakStmt(line);
  }

  private continueStmt(): AST.ContinueStmt {
    const line = this.peek().line;
    this.advance();
    this.consume(TokenType.Semicolon, "Expected ';' after continue");
    return new AST.ContinueStmt(line);
  }

  private returnStmt(): AST.ReturnStmt {
    const line = this.peek().line;
    this.advance();
    if (this.match(TokenType.Semicolon)) return new AST.ReturnStmt(line, null);
    const expr = this.expression();
    this.consume(TokenType.Semicolon, "Expected ';' after return");
    return new AST.ReturnStmt(line, expr);
  }

  private ifStmt(): AST.IfStmt {
    const line = this.peek().line;
    this.advance();
    this.consume(TokenType.LParen, "Expected '(' after if");
    const cond = this.expression();
    this.tryConsume(TokenType.RParen);
    const body = this.blockStatements();
    let elseBody: AST.Stmt[] | null = null;
    if (this.match(TokenType.Else)) {
      elseBody = this.blockStatements();
    }
    return new AST.IfStmt(line, cond, body, elseBody);
  }

  private whileStmt(): AST.LoopStmt {
    const line = this.peek().line;
    this.advance();
    this.consume(TokenType.LParen, "Expected '(' after while");
    const cond = this.expression();
    this.tryConsume(TokenType.RParen);
    const body = this.blockStatements();
    return new AST.LoopStmt(line, cond, null, null, body);
  }

  private forStmt(): AST.LoopStmt {
    const line = this.peek().line;
    this.advance();
    this.consume(TokenType.LParen, "Expected '(' after for");
    // Init can be an assignment expression or empty
    let init: AST.Expr | null = null;
    if (!this.check(TokenType.Semicolon)) {
      init = this.stmtExpr();
      if (!init) init = this.expression();
    }
    this.tryConsume(TokenType.Semicolon);
    const cond = this.expression();
    this.tryConsume(TokenType.Semicolon);
    let end: AST.Expr | null = null;
    if (!this.check(TokenType.RParen)) {
      end = this.stmtExpr();
      if (!end) end = this.expression();
    }
    this.tryConsume(TokenType.RParen);
    const body = this.blockStatements();
    return new AST.LoopStmt(line, cond, init, end, body);
  }

  private switchStmt(): AST.IfStmt {
    const line = this.peek().line;
    this.advance();
    let isStringSwitch = false;
    if (this.match(TokenType.Dollar)) isStringSwitch = true;
    this.consume(TokenType.LParen, "Expected '(' after switch");
    const expr = this.expression();
    this.consume(TokenType.RParen, "Expected ')' after switch expression");
    this.consume(TokenType.LBracket, "Expected '{' before switch body");

    const cases = this.caseBlock(expr, isStringSwitch);
    this.consume(TokenType.RBracket, "Expected '}' after switch body");
    return cases;
  }

  private caseBlock(switchExpr: AST.Expr, isStringSwitch: boolean): AST.IfStmt {
    this.consume(TokenType.Case, "Expected 'case'");
    const conditions: AST.Expr[] = [this.expression()];
    while (this.match(TokenType.Or)) {
      conditions.push(this.expression());
    }
    this.consume(TokenType.Colon, "Expected ':' after case expression");
    const stmts = this.statementList();

    // Build the if chain
    let checkExpr: AST.Expr;
    if (isStringSwitch) {
      checkExpr = new AST.StrEqExpr(switchExpr, conditions[0], makeToken(TokenType.StringEquals, '$=', '$=', 0, 0));
      for (let i = 1; i < conditions.length; i++) {
        checkExpr = new AST.IntBinaryExpr(checkExpr,
          new AST.StrEqExpr(switchExpr, conditions[i], makeToken(TokenType.StringEquals, '$=', '$=', 0, 0)),
          makeToken(TokenType.LogicalOr, '||', '||', 0, 0));
      }
    } else {
      checkExpr = new AST.IntBinaryExpr(switchExpr, conditions[0], makeToken(TokenType.Equal, '==', '==', 0, 0));
      for (let i = 1; i < conditions.length; i++) {
        checkExpr = new AST.IntBinaryExpr(checkExpr,
          new AST.IntBinaryExpr(switchExpr, conditions[i], makeToken(TokenType.Equal, '==', '==', 0, 0)),
          makeToken(TokenType.LogicalOr, '||', '||', 0, 0));
      }
    }

    const ifStmt = new AST.IfStmt(checkExpr.lineNo, checkExpr, stmts, null);

    // Check for more cases or default
    if (this.check(TokenType.Case)) {
      const nextCase = this.caseBlock(switchExpr, isStringSwitch);
      ifStmt.elseBody = [nextCase];
    } else if (this.check(TokenType.Default)) {
      this.advance();
      this.consume(TokenType.Colon, "Expected ':' after default");
      ifStmt.elseBody = this.statementList();
    }

    return ifStmt;
  }

  private datablockStmt(): AST.ObjectDeclExpr {
    this.advance(); // consume 'datablock'
    const className = this.consume(TokenType.Label, 'Expected class name');
    this.consume(TokenType.LParen, "Expected '(' after datablock name");
    const name = this.consume(TokenType.Label, 'Expected datablock name');
    let parentName: Token | null = null;
    if (this.match(TokenType.Colon)) {
      parentName = this.consume(TokenType.Label, 'Expected parent name');
    }
    this.consume(TokenType.RParen, "Expected ')' after datablock name");
    this.consume(TokenType.LBracket, "Expected '{' before datablock body");
    const slots: AST.SlotAssignExpr[] = [];
    while (!this.check(TokenType.RBracket) && !this.isAtEnd()) {
      const slot = this.slotAssign();
      if (slot) slots.push(slot);
      else break;
    }
    this.consume(TokenType.RBracket, "Expected '}' after datablock body");
    this.tryConsume(TokenType.Semicolon);
    const result = new AST.ObjectDeclExpr(
      new AST.ConstantExpr(className), parentName, new AST.ConstantExpr(name), [], slots, [], true
    );
    return result;
  }

  private slotAssign(): AST.SlotAssignExpr | null {
    if (this.check(TokenType.Label)) {
      const slotName = this.advance();
      let arrayIdx: AST.Expr | null = null;
      if (this.match(TokenType.LeftSquareBracket)) {
        arrayIdx = this.parseArrayIndex();
        this.consume(TokenType.RightSquareBracket, "Expected ']' after array index");
      }
      this.consume(TokenType.Assign, "Expected '=' after slot name");
      const expr = this.expression();
      this.tryConsume(TokenType.Semicolon);
      return new AST.SlotAssignExpr(null, arrayIdx, slotName, expr);
    }
    return null;
  }

  private blockStatements(): AST.Stmt[] {
    if (this.match(TokenType.LBracket)) {
      const stmts = this.statementList();
      this.consume(TokenType.RBracket, "Expected '}' after block");
      return stmts;
    }
    const s = this.stmt();
    return s ? [s] : [];
  }

  private expressionStmt(): AST.Stmt | null {
    const expr = this.stmtExpr();
    if (expr) {
      this.tryConsume(TokenType.Semicolon);
    }
    return expr;
  }

  private stmtExpr(): AST.Expr | null {
    let expr = this.expression();
    if (!expr) return null;

    // Support chained postfix operations: obj.method1().method2(), var[].field, etc.
    let handled = true;
    while (handled) {
      handled = false;

      // Check for slot access, method call, or assignment via dot
      if (this.match(TokenType.Dot)) {
        handled = true;
        const label = this.consume(TokenType.Label, 'Expected label after .');
        let arrAccess: AST.Expr | null = null;
        if (this.match(TokenType.LeftSquareBracket)) {
          arrAccess = this.parseArrayIndex();
          this.consume(TokenType.RightSquareBracket, "Expected ']' after array index");
        }
        if (this.match(TokenType.Assign)) {
          const rexpr = this.expression();
          return new AST.SlotAssignExpr(expr, arrAccess, label, rexpr);
        }
        if (this.check(TokenType.PlusPlus) || this.check(TokenType.MinusMinus)) {
          const op = this.advance();
          return new AST.ParenthesisExpr(new AST.SlotAssignOpExpr(expr, arrAccess, label, null, op));
        }
        const assignOpTypes = [
          TokenType.PlusAssign, TokenType.MinusAssign, TokenType.MultiplyAssign,
          TokenType.DivideAssign, TokenType.ModulusAssign, TokenType.AndAssign,
          TokenType.OrAssign, TokenType.XorAssign, TokenType.ShiftLeftAssign,
          TokenType.ShiftRightAssign,
        ];
        if (assignOpTypes.includes(this.peek().type)) {
          const op = this.advance();
          const rexpr = this.expression();
          return new AST.SlotAssignOpExpr(expr, arrAccess, label, rexpr, op);
        }
        if (this.match(TokenType.LParen)) {
          const args: AST.Expr[] = [expr];
          if (!this.check(TokenType.RParen)) {
            args.push(this.expression());
            while (this.match(TokenType.Comma)) {
              args.push(this.expression());
            }
          }
          this.consume(TokenType.RParen, "Expected ')' after arguments");
          expr = new AST.FuncCallExpr(label, null, args, FuncCallType.MethodCall);
          continue; // allow more chaining
        }
        // Not an assignment, just slot access
        expr = new AST.SlotAccessExpr(expr, arrAccess, label);
        continue;
      }
    }

    // Check for variable assignment
    if (expr instanceof AST.VarExpr) {
      if (this.match(TokenType.LeftSquareBracket)) {
        const arrExpr = this.parseArrayIndex();
        this.consume(TokenType.RightSquareBracket, "Expected ']' after array index");
        expr.arrayIndex = arrExpr;
      }
      if (this.match(TokenType.Assign)) {
        const rexpr = this.expression();
        return new AST.AssignExpr(expr, rexpr);
      }
      if (this.check(TokenType.PlusPlus) || this.check(TokenType.MinusMinus)) {
        const op = this.advance();
        return new AST.ParenthesisExpr(new AST.AssignOpExpr(expr, null, op));
      }
      const assignOpTypes = [
        TokenType.PlusAssign, TokenType.MinusAssign, TokenType.MultiplyAssign,
        TokenType.DivideAssign, TokenType.ModulusAssign, TokenType.AndAssign,
        TokenType.OrAssign, TokenType.XorAssign, TokenType.ShiftLeftAssign,
        TokenType.ShiftRightAssign,
      ];
      if (assignOpTypes.includes(this.peek().type)) {
        const op = this.advance();
        const rexpr = this.expression();
        return new AST.AssignOpExpr(expr, rexpr, op);
      }
      return expr;
    }

    // Check for field assignment: SlotAccessExpr with non-null slotName (field access)
    if (expr instanceof AST.SlotAccessExpr && expr.slotName !== null) {
      if (this.match(TokenType.Assign)) {
        const rexpr = this.expression();
        return new AST.SlotAssignExpr(expr.objectExpr, null, expr.slotName, rexpr);
      }
      if (this.check(TokenType.PlusPlus) || this.check(TokenType.MinusMinus)) {
        const op = this.advance();
        return new AST.ParenthesisExpr(new AST.SlotAssignOpExpr(expr.objectExpr, null, expr.slotName, null, op));
      }
      const slotAssignOpTypes = [
        TokenType.PlusAssign, TokenType.MinusAssign, TokenType.MultiplyAssign,
        TokenType.DivideAssign, TokenType.ModulusAssign, TokenType.AndAssign,
        TokenType.OrAssign, TokenType.XorAssign, TokenType.ShiftLeftAssign,
        TokenType.ShiftRightAssign,
      ];
      if (slotAssignOpTypes.includes(this.peek().type)) {
        const op = this.advance();
        const rexpr = this.expression();
        return new AST.SlotAssignOpExpr(expr.objectExpr, null, expr.slotName, rexpr, op);
      }
      return expr;
    }

    // Check for array element assignment: SlotAccessExpr with null slotName (array access)
    if (expr instanceof AST.SlotAccessExpr && expr.slotName === null && expr.arrayExpr !== null) {
      if (this.match(TokenType.Assign)) {
        const rexpr = this.expression();
        return new AST.SlotAssignExpr(expr.objectExpr, expr.arrayExpr, null, rexpr);
      }
      if (this.check(TokenType.PlusPlus) || this.check(TokenType.MinusMinus)) {
        const op = this.advance();
        return new AST.ParenthesisExpr(new AST.SlotAssignOpExpr(expr.objectExpr, expr.arrayExpr, null, null, op));
      }
      return expr;
    }

    // Check for function call (label followed by parenthesized args)
    if (expr instanceof AST.ConstantExpr) {
      if (this.match(TokenType.LParen)) {
        const args: AST.Expr[] = [];
        if (!this.check(TokenType.RParen)) {
          args.push(this.expression());
          while (this.match(TokenType.Comma)) {
            args.push(this.expression());
          }
        }
        this.consume(TokenType.RParen, "Expected ')' after arguments");
        return new AST.FuncCallExpr(expr.name, null, args, FuncCallType.FunctionCall);
      }
    }

    return expr;
  }

  // Expression parsing with precedence climbing
  private expression(): AST.Expr {
    return this.ternary();
  }

  private ternary(): AST.Expr {
    let expr = this.orExpr();
    if (this.match(TokenType.QuestionMark)) {
      const trueExpr = this.expression();
      this.consume(TokenType.Colon, "Expected ':' in ternary");
      const falseExpr = this.expression();
      expr = new AST.ConditionalExpr(expr, trueExpr, falseExpr);
    }
    return expr;
  }

  private orExpr(): AST.Expr {
    let expr = this.andExpr();
    while (this.match(TokenType.LogicalOr)) {
      const right = this.andExpr();
      expr = new AST.IntBinaryExpr(expr, right, this.previous());
    }
    return expr;
  }

  private andExpr(): AST.Expr {
    let expr = this.bitwiseOr();
    while (this.match(TokenType.LogicalAnd)) {
      const right = this.bitwiseOr();
      expr = new AST.IntBinaryExpr(expr, right, this.previous());
    }
    return expr;
  }

  private bitwiseOr(): AST.Expr {
    let expr = this.bitwiseXor();
    while (this.match(TokenType.BitwiseOr)) {
      const right = this.bitwiseXor();
      expr = new AST.IntBinaryExpr(expr, right, this.previous());
    }
    return expr;
  }

  private bitwiseXor(): AST.Expr {
    let expr = this.bitwiseAnd();
    while (this.match(TokenType.BitwiseXor)) {
      const right = this.bitwiseAnd();
      expr = new AST.IntBinaryExpr(expr, right, this.previous());
    }
    return expr;
  }

  private bitwiseAnd(): AST.Expr {
    let expr = this.equality();
    while (this.match(TokenType.BitwiseAnd)) {
      const right = this.equality();
      expr = new AST.IntBinaryExpr(expr, right, this.previous());
    }
    return expr;
  }

  private equality(): AST.Expr {
    let expr = this.strEquality();
    if (this.match(TokenType.Equal) || this.match(TokenType.NotEqual)) {
      const op = this.previous();
      const right = this.strEquality();
      expr = new AST.IntBinaryExpr(expr, right, op);
    }
    return expr;
  }

  private strEquality(): AST.Expr {
    let expr = this.relational();
    if (this.match(TokenType.StringEquals) || this.match(TokenType.StringNotEquals)) {
      const op = this.previous();
      const right = this.relational();
      expr = new AST.StrEqExpr(expr, right, op);
    }
    return expr;
  }

  private relational(): AST.Expr {
    let expr = this.shift();
    const relationalTypes = [TokenType.LessThan, TokenType.GreaterThan, TokenType.LessThanEqual, TokenType.GreaterThanEqual];
    while (relationalTypes.includes(this.peek().type)) {
      const op = this.advance();
      const right = this.shift();
      expr = new AST.IntBinaryExpr(expr, right, op);
    }
    return expr;
  }

  private shift(): AST.Expr {
    let expr = this.term();
    while (this.check(TokenType.LeftBitShift) || this.check(TokenType.RightBitShift)) {
      const op = this.advance();
      const right = this.term();
      expr = new AST.IntBinaryExpr(expr, right, op);
    }
    return expr;
  }

  private term(): AST.Expr {
    let expr = this.strcat();
    while (this.check(TokenType.Plus) || this.check(TokenType.Minus)) {
      const op = this.advance();
      const right = this.strcat();
      expr = new AST.FloatBinaryExpr(expr, right, op);
    }
    return expr;
  }

  private strcat(): AST.Expr {
    let expr = this.factor();
    const concatTypes = [TokenType.Concat, TokenType.SpaceConcat, TokenType.TabConcat, TokenType.NewlineConcat];
    while (concatTypes.includes(this.peek().type)) {
      const op = this.advance();
      const right = this.factor();
      expr = new AST.StrCatExpr(expr, right, op);
    }
    return expr;
  }

  private factor(): AST.Expr {
    let expr = this.unary();
    while (this.check(TokenType.Multiply) || this.check(TokenType.Divide) || this.check(TokenType.Modulus)) {
      const op = this.advance();
      const right = this.unary();
      expr = new AST.FloatBinaryExpr(expr, right, op);
    }
    return expr;
  }

  private unary(): AST.Expr {
    if (this.match(TokenType.Minus)) {
      const op = this.previous();
      const expr = this.unary();
      return new AST.FloatUnaryExpr(expr, op);
    }
    if (this.match(TokenType.Not)) {
      const op = this.previous();
      const expr = this.unary();
      return new AST.IntUnaryExpr(expr, op);
    }
    if (this.match(TokenType.Tilde)) {
      const op = this.previous();
      const expr = this.unary();
      return new AST.IntUnaryExpr(expr, op);
    }
    return this.chainExpr();
  }

  private chainExpr(): AST.Expr {
    let expr = this.primary();
    if (!expr) return new AST.StringConstExpr(0, '', false);

    // Handle function calls: label(...)
    if (expr instanceof AST.ConstantExpr && this.check(TokenType.LParen)) {
      this.advance(); // consume (
      const args: AST.Expr[] = [];
      if (!this.check(TokenType.RParen)) {
        args.push(this.expression());
        while (this.match(TokenType.Comma)) {
          args.push(this.expression());
        }
      }
      this.consume(TokenType.RParen, "Expected ')' after arguments");
      expr = new AST.FuncCallExpr(expr.name, null, args, FuncCallType.FunctionCall);
    }

    // Handle slot access chains
    while (this.check(TokenType.Dot)) {
      this.advance();
      const label = this.consume(TokenType.Label, 'Expected label after .');
      let arrAccess: AST.Expr | null = null;
      if (this.match(TokenType.LeftSquareBracket)) {
        arrAccess = this.parseArrayIndex();
        this.consume(TokenType.RightSquareBracket, "Expected ']'");
      }
      expr = new AST.SlotAccessExpr(expr, arrAccess, label);
    }

    // Handle namespace::name for both constants and variables (including chained ::)
    // Must come BEFORE array access so $Game::argv[$i] parses correctly
    while ((expr instanceof AST.ConstantExpr || expr instanceof AST.VarExpr) && this.check(TokenType.DoubleColon)) {
      this.advance();
      const name = this.consume(TokenType.Label, 'Expected name after ::');
      if (this.check(TokenType.LParen)) {
        this.advance();
        const args: AST.Expr[] = [];
        if (!this.check(TokenType.RParen)) {
          args.push(this.expression());
          while (this.match(TokenType.Comma)) {
            args.push(this.expression());
          }
        }
        this.consume(TokenType.RParen, "Expected ')' after arguments");
        expr = new AST.FuncCallExpr(name, expr instanceof AST.ConstantExpr ? expr.name : expr.name, args, FuncCallType.MethodCall);
        break;
      } else {
        if (expr instanceof AST.VarExpr) {
          expr = new AST.VarExpr(name, expr.name, null, expr.vtype);
        } else {
          expr = new AST.ConstantExpr(name);
        }
      }
    }
    if (expr instanceof AST.FuncCallExpr) return expr;

    // Handle direct array access: expr[expr]
    while (this.check(TokenType.LeftSquareBracket)) {
      this.advance();
      const index = this.parseArrayIndex();
      this.consume(TokenType.RightSquareBracket, "Expected ']' after array index");
      if (expr instanceof AST.VarExpr && expr.arrayIndex === null) {
        expr.arrayIndex = index;
      } else {
        expr = new AST.SlotAccessExpr(expr, index, null);
      }
    }

    // Handle slot access chains
    while (this.check(TokenType.Dot)) {
      this.advance();
      const label = this.consume(TokenType.Label, 'Expected label after .');
      let arrAccess: AST.Expr | null = null;
      if (this.match(TokenType.LeftSquareBracket)) {
        arrAccess = this.parseArrayIndex();
        this.consume(TokenType.RightSquareBracket, "Expected ']'");
      }
      expr = new AST.SlotAccessExpr(expr, arrAccess, label);
    }

    // Handle chained method calls: expr.method1().method2()
    while (expr instanceof AST.SlotAccessExpr && expr.slotName !== null && this.check(TokenType.LParen)) {
      this.advance();
      const args: AST.Expr[] = [];
      if (!this.check(TokenType.RParen)) {
        args.push(this.expression());
        while (this.match(TokenType.Comma)) {
          args.push(this.expression());
        }
      }
      this.consume(TokenType.RParen, "Expected ')' after arguments");
      expr = new AST.FuncCallExpr(expr.slotName, null, args, FuncCallType.MethodCall, expr.objectExpr);
      // After method call, check for more dot chains (chained method calls)
      if (this.check(TokenType.Dot)) {
        this.advance();
        const label2 = this.consume(TokenType.Label, 'Expected label after .');
        let arrAccess2: AST.Expr | null = null;
        if (this.match(TokenType.LeftSquareBracket)) {
          arrAccess2 = this.parseArrayIndex();
          this.consume(TokenType.RightSquareBracket, "Expected ']'");
        }
        expr = new AST.SlotAccessExpr(expr, arrAccess2, label2);
      }
    }

    return expr;
  }

  private primary(): AST.Expr | null {
    if (this.match(TokenType.LParen)) {
      const expr = this.expression();
      this.consume(TokenType.RParen, "Expected ')'");
      return new AST.ParenthesisExpr(expr);
    }
    if (this.match(TokenType.String)) {
      return new AST.StringConstExpr(this.previous().line, this.previous().literal, false);
    }
    if (this.match(TokenType.TaggedString)) {
      return new AST.StringConstExpr(this.previous().line, this.previous().literal, true);
    }
    if (this.match(TokenType.Int)) {
      return new AST.IntExpr(this.previous().line, this.previous().literal);
    }
    if (this.match(TokenType.Float)) {
      return new AST.FloatExpr(this.previous().line, this.previous().literal);
    }
    if (this.match(TokenType.HexInt)) {
      return new AST.IntExpr(this.previous().line, parseInt(this.previous().literal, 16));
    }
    if (this.match(TokenType.True)) {
      return new AST.IntExpr(this.previous().line, 1);
    }
    if (this.match(TokenType.False)) {
      return new AST.IntExpr(this.previous().line, 0);
    }
    if (this.match(TokenType.New)) {
      const className = this.consume(TokenType.Label, 'Expected class name after new');
      return this.objectDecl(className, false, false);
    }
    if (this.match(TokenType.Label)) {
      return new AST.ConstantExpr(this.previous());
    }
    if (this.match(TokenType.Dollar) || this.match(TokenType.Modulus)) {
      const isGlobal = this.previous().type === TokenType.Dollar;
      return this.parseVariableNameToken(isGlobal);
    }
    return null;
  }

  // Utility methods
  private match(type: TokenType): boolean {
    if (this.check(type)) { this.advance(); return true; }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.Eof;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new SyntaxError(message, this.peek());
  }

  // Optional consume — silently skip if token not present (for lenient T2 parsing)
  private tryConsume(type: TokenType): boolean {
    if (this.check(type)) { this.advance(); return true; }
    return false;
  }

  private objectDecl(className: Token, structDecl: boolean, consumeTrailingSemicolon: boolean): AST.ObjectDeclExpr {
    let objectNameExpr: AST.Expr = new AST.ConstantExpr(className);
    let parentObject: Token | null = null;
    const args: AST.Expr[] = [];

    if (this.match(TokenType.LParen)) {
      if (!this.check(TokenType.RParen)) {
        objectNameExpr = this.expression();
        if (this.match(TokenType.Colon)) {
          parentObject = this.consume(TokenType.Label, 'Expected parent object name after :');
        }
        while (this.match(TokenType.Comma)) {
          args.push(this.expression());
        }
      }
      this.consume(TokenType.RParen, "Expected ')' after object arguments");
    }

    const slots: AST.SlotAssignExpr[] = [];
    const subObjects: AST.ObjectDeclExpr[] = [];
    if (this.match(TokenType.LBracket)) {
      while (!this.check(TokenType.RBracket) && !this.isAtEnd()) {
        if (this.match(TokenType.New)) {
          const subClassName = this.consume(TokenType.Label, 'Expected class name after new');
          subObjects.push(this.objectDecl(subClassName, false, true));
          continue;
        }
        const slot = this.slotAssign();
        if (slot) {
          slots.push(slot);
          continue;
        }
        throw new SyntaxError("Expected slot assignment or nested object", this.peek());
      }
      this.consume(TokenType.RBracket, "Expected '}' after object body");
    }

    if (consumeTrailingSemicolon) {
      this.tryConsume(TokenType.Semicolon);
    }

    return new AST.ObjectDeclExpr(
      new AST.ConstantExpr(className), parentObject, objectNameExpr, args, slots, subObjects, structDecl
    );
  }
}
