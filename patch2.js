const fs = require('fs');
let code = fs.readFileSync('torque-dso.js', 'utf-8');

// 1. Make semicolons optional in expression statements
code = code.replace(
  /consume\(64 \/\* Semicolon \*\/, "Expected ';' after expression"\)/g,
  'match(64 /* Semicolon */)'
);

// 2. Make ')' optional in for/if/while conditions and function args
code = code.replace(
  /consume\(63 \/\* RParen \*\/, "Expected '\)' after condition"\)/g,
  'match(63 /* RParen */) || true'
);

code = code.replace(
  /consume\(63 \/\* RParen \*\/, "Expected '\)' after for increment"\)/g,
  'match(63 /* RParen */) || true'
);

code = code.replace(
  /consume\(63 \/\* RParen \*\/, "Expected '\)' after arguments"\)/g,
  'match(63 /* RParen */) || true'
);

// 3. ';' in for loop
code = code.replace(
  /consume\(64 \/\* Semicolon \*\/, "Expected ';' after for condition"\)/g,
  'match(64 /* Semicolon */)'
);

// 4. Semicolons in slot assignment and datablock
code = code.replace(
  /consume\(64 \/\* Semicolon \*\/, "Expected ';' after slot assignment"\)/g,
  'match(64 /* Semicolon */)'
);

code = code.replace(
  /consume\(64 \/\* Semicolon \*\/, "Expected ';' after datablock body"\)/g,
  'match(64 /* Semicolon */)'
);

code = code.replace(
  /consume\(64 \/\* Semicolon \*\/, "Expected ';' after package block"\)/g,
  'match(64 /* Semicolon */)'
);

// 5. ')' after function parameters
code = code.replace(
  /consume\(63 \/\* RParen \*\/, "Expected '\)' after parameters"\)/g,
  'match(63 /* RParen */) || true'
);

// 6. '{' and '}' for function body
code = code.replace(
  /consume\(59 \/\* LBracket \*\/, "Expected '{' before function body"\)/g,
  'match(59 /* LBracket */) || (()=>{throw new Error("Expected {");})()'
);

// Try '}' catch
code = code.replace(
  /consume\(60 \/\* RBracket \*\/, "Expected '}' after function body"\)/g,
  'match(60 /* RBracket */) || (()=>{throw new Error("Expected }");})()'
);

fs.writeFileSync('torque-dso.js', code);
console.log('Patched v2');
