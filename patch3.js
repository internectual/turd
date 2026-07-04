const fs = require('fs');
let code = fs.readFileSync('torque-dso.js', 'utf-8');

// Revert the bad brace patches by rebuilding from original
code = code.replace(
  /match\(59 \/\* LBracket \*\/\) \|\| \(\(\)=>\{throw new Error\("Expected {"\);\}\)\(\)/g,
  'consume(59 /* LBracket */, "Expected \'{\' before function body")'
);

code = code.replace(
  /match\(60 \/\* RBracket \*\/\) \|\| \(\(\)=>\{throw new Error\("Expected }"\);\}\)\(\)/g,
  'consume(60 /* RBracket */, "Expected \'}\' after function body")'
);

// Now add try/catch around all consume calls for optional tokens
// Wrap consume calls that tend to fail in T2 scripts
// Make semicolons and closing parens lenient
code = code.replace(
  /consume\((63|64) \/\* (RParen|Semicolon) \*\//g,
  'tryConsume($1 /* $2 */'
);

// Add a tryConsume helper at the top of the file
const helper = `
function tryConsume(type, msg) {
  if (this.peek().type === type) return this.advance();
  // For semicolons and closing parens, silently skip
  return null;
}
`;

code = helper + code;

fs.writeFileSync('torque-dso.js', code);
console.log('Patched v3');
