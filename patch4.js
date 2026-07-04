const fs = require('fs');
let code = fs.readFileSync('torque-dso.js', 'utf-8');

// Replace Parser.prototype.parse to catch per-statement errors
code = code.replace(
  'this.parse = function () {\n      const stmts = [];\n      while (!this.isAtEnd()) {\n        const s = this.decl();\n        if (s) stmts.push(s);\n      }\n      return stmts;',
  'this.parse = function () {\n      const stmts = [];\n      while (!this.isAtEnd()) {\n        try { const s = this.decl(); if (s) stmts.push(s); }\n        catch(e) { this.advance(); }\n      }\n      return stmts;'
);

// Make statement parsing error-tolerant  
code = code.replace(
  'this.mFunctionDecl = function () {\n      if (!this.match(56 /* Function */))',
  'this.mFunctionDecl = function () {\n      try { return this._functionDecl(); } catch(e) { return null; } }\n  this._functionDecl = function () {\n      if (!this.match(56 /* Function */))'
);

// Make expressionStmt lenient - don't fail on missing semicolon
code = code.replace(
  'this.mExpressionStmt = function () {\n      const expr = this.stmtExpr();',
  'this.mExpressionStmt = function () {\n      try {\n      const expr = this.stmtExpr();'
);

code = code.replace(
  'this.mStatementList = function () {\n      const stmts = [];\n      while',
  'this.mStatementList = function () {\n      const stmts = [];\n      while'
);
// actually keep statementList as-is, just make expressionStmt tolerant

// Close the try for expressionStmt  
code = code.replace(
  'if (expr) {\n        this.consume(64 /* Semicolon */, "Expected \';\' after expression");\n      }',
  'if (expr) {\n        this.match(64);\n      }'
);

// Add catch at end of expressionStmt
code = code.replace(
  'this.mForStmt = function () {',
  '} catch(e) { return null; } }\n  this.mForStmt = function () {'
);

fs.writeFileSync('torque-dso.js', code);
console.log('Patched v4');
