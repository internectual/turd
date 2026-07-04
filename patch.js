const fs = require('fs');
const code = fs.readFileSync('torque-dso.js', 'utf-8');

// Make semicolons optional in expressionStmt and compile block
let patched = code;

// 1. expressionStmt: make trailing semicolon optional
patched = patched.replace(
  'this.expression();\n      this.consume(TokenType.Semicolon, "Expected \';\' after expression");\n      return expr;',
  'this.expression();\n      this.match(TokenType.Semicolon);\n      return expr;'
);

// 2. forStmt init: handle missing init expression  
patched = patched.replace(
  'init = this.stmtExpr();\n      if (!init) init = this.expression();',
  'try { init = this.stmtExpr(); if (!init) init = this.expression(); } catch(e) { init = null; }'
);

// 3. forStmt: make condition and increment semicolons optional  
patched = patched.replace(
  'this.consume(TokenType.Semicolon, "Expected \';\' after for condition");',
  'this.match(TokenType.Semicolon);'
);

// 4. Make ')' after for increment optional
patched = patched.replace(
  'this.consume(TokenType.RParen, "Expected \')\' after for increment");',
  'if(!this.match(TokenType.RParen)) { /* skip unexpected */ }'
);

// 5. Make ')' in if/while optional
patched = patched.replace(
  'this.consume(TokenType.RParen, "Expected \')\' after condition");',
  'if(!this.match(TokenType.RParen)) { /* lenient */ }'
);

// 6. Make ')' in function arguments optional
patched = patched.replace(
  'this.consume(TokenType.RParen, "Expected \')\' after arguments");',
  'if(!this.match(TokenType.RParen)) { /* skip */ }'
);

fs.writeFileSync('torque-dso.js', patched);
console.log('Patched compiler successfully');
