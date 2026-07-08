# dso-web Project Summary

## Repository
https://github.com/internectual/turd

## What This Project Is
A TorqueScript compiler and DSO decompiler written in TypeScript. Compiles TorqueScript source code into binary DSO files for 8 different game engine targets, and can decompile DSO files back to TorqueScript source.

## Current Status
**WORKING:** All 8 targets compile and decompile a simple test case correctly. Real DSO files (from Tribes 2, Blockland, etc.) also decompile correctly.

### Supported Targets
| Target | Version | Status |
|--------|---------|--------|
| TGE10 | 33 | ✅ |
| Tribes2 | 174 | ✅ |
| TGE14 | 36 | ✅ |
| Constructor | 38 | ✅ |
| TFD | 33 | ✅ |
| BlocklandV1 | 90 | ✅ |
| BlocklandV20 | 190 | ✅ |
| BlocklandV21 | 210 | ✅ |

### Test Results
- Simple single-function test: All 8 targets PASS
- Complex multi-function test: Fails (identifier table overflow, precompile under-counting)
- Real DSO decompilation: PASS (41008 chars for GameGui.cs.dso)

## Project Structure
```
src/
  compiler/
    scanner.ts      - TorqueScript lexer
    parser.ts       - TorqueScript parser (returns AST)
    ast.ts          - AST node types
    compiler.ts     - AST → bytecode compiler (two-pass: count + emit)
    compiler-types.ts - Shared types (StringTable, IdentTable, CompileContext)
    index.ts        - Module exports
  decompiler.ts     - DSO → TorqueScript decompiler (monolithic, ~2000 lines)
  opcodes.ts        - Opcode mappings for all 8 targets (OPS_MAPS)
  dso.ts            - DSO file loading + zip support
  main.ts           - Web app UI (React/Prism)
decomptest.vl2      - Test archive (8 compiled DSOs + source)
test_simple.cs      - Simple TorqueScript test file
```

## Key Technical Details

### Two-Pass Compiler
1. **Precompile pass**: Counts the number of bytecode slots needed (no output). Used to allocate the code stream array.
2. **Emit pass**: Writes actual bytecode into the pre-allocated array.

### DSO File Format (as written by compiler)
```
[u32] version
[u32] globalStringTable.totalLen
[bytes] global string table data (null-terminated + padded entries)
[u32] globalFloatTable.count
[f64 * count] global float table
[u32] functionStringTable.totalLen
[bytes] function string table data
[u32] functionFloatTable.count
[f64 * count] function float table
[u32] codeSize (number of opcodes)
[u32] breakCount (half of lineBreakPairCount)
[opcodes] code stream (1 byte per opcode if ≤ 0xFF, 5 bytes for extended: 0xFF + u32 LE)
[u32 * breakCount * 2] line break pairs
[u32] identifierCount
For each identifier:
  [u32] stringIndex (index into global string table)
  [u32] positionCount
  [u32 * positionCount] code positions where this string is referenced
```

### Code Stream Encoding
- Opcodes ≤ 255: written as single byte
- Opcodes > 255: written as 0xFF followed by u32 (little-endian) — "extended opcode" format
- Jump targets can be > 255 and use the same extended format
- The decompiler's `readOp()` handles both formats

### Opcode Mapping
Each target has different numeric values for the same opcode names. The `OPS_MAPS` in `opcodes.ts` defines per-target mappings. Example: `OP_FUNC_DECL` is 0 for TGE10 but 83 (0x53) for BlocklandV21.

### Decompiler Opcode Selection
The decompiler reads the DSO version from the header and selects the correct opcode map:
```typescript
const VERSION_OPS: Record<number, OpsMap> = {
  33: OPS_MAPS.TGE10,
  174: OPS_MAPS.Tribes2,
  36: OPS_MAPS.TGE14,
  38: OPS_MAPS.Constructor,
  90: OPS_MAPS.BlocklandV1,
  190: OPS_MAPS.BlocklandV20,
  210: OPS_MAPS.BlocklandV21,
};
```

The `Ops` constructor accepts an optional `OpsMap` and builds its internal `_tags` map from it, enabling per-target opcode validation.

## Known Issues / Remaining Work

### 1. Identifier Table Overflow (HIGH PRIORITY)
**Symptom:** Complex multi-function scripts produce DSOs that fail to decompile with "Offset is outside the bounds of the DataView".

**Root cause:** The identifier table grows large with many functions/variables, but the code stream also grows, leaving insufficient room in the file. The identifier table format stores ALL code positions that reference each string index.

**Fix needed:** Optimize the identifier table format or compress it. The real DSO format may use a more compact encoding.

### 2. Precompile Under-Counting (HIGH PRIORITY)
**Symptom:** `context.ip` after compilation is larger than the precompiled `codeSize`. Works for simple scripts, fails for complex ones.

**Root cause:** The precompile pass doesn't accurately count slots for all operator types, especially complex expressions, nested control flow, and string operations.

**Fix needed:** Improve precompile counting in `precompileStmt`, `precompileExpr`, and `precompileFunction`. Or switch to a dynamic array approach where the code stream grows as needed.

### 3. Complex TorqueScript Features Not Supported (MEDIUM)
**Symptom:** Scripts using `switch`, `new`, `datablock`, `package` blocks, `::` namespace calls, and complex expressions fail to compile or produce incorrect bytecode.

**Parser issues:**
- `package PackageName { ... }` block parsing returns only the first function (line 44-61 of parser.ts has a comment acknowledging this)
- `new` expressions not parsed
- `switch` partially supported but may have layout issues
- `::` namespace separator in function calls not handled in expression context

**Compiler issues:**
- Many AST node types have no compilation path in `compileExpr`
- `ObjectDeclExpr`, `SlotAssignOpExpr`, and other complex types unsupported

### 4. Blockland XOR Decryption (LOW)
Blockland DSO files have encrypted string tables (XOR key: `"cl3buotro"`). The current decompiler reads strings as-is, so Blockland string names appear garbled. The dso-sharp C# source has `UnencryptString` method that needs to be ported.

### 5. Two-Pass Architecture Fragility (MEDIUM)
The two-pass approach (count then emit) requires exact slot counting. Any mismatch causes crashes. Consider switching to a single-pass approach with dynamic array growth, then serializing the final array.

## Environment
- Node.js 26+ with tsx for runtime TypeScript execution
- Vite for building the web app
- fflate for zip compression
- prism-react-renderer for syntax highlighting

## How to Run

```bash
cd /home/methodown/turd
npm install

# Quick test
npx tsx -e "
var T = require('./src/compiler/index');
var D = require('./src/decompiler');
for (var target of ['TGE10','Tribes2','TGE14','Constructor','TFD','BlocklandV1','BlocklandV20','BlocklandV21']) {
  var c = new T.Compiler(target);
  var b = c.compile('function test() { return 1; }');
  var r = D.decompile(new Uint8Array(b));
  console.log(target + ': ' + (r.ok ? 'PASS' : 'FAIL: ' + r.error));
}
"

# Run existing tests
npx tsx src/decompiler.ts  # runs embedded tests
```

## Key Files to Understand First
1. `src/opcodes.ts` — Opcode mappings for all 8 targets
2. `src/compiler/compiler.ts` — Main compiler logic (two-pass, ~770 lines)
3. `src/decompiler.ts` — Decompiler (~2000 lines, monolithic)
4. `src/compiler/parser.ts` — TorqueScript parser
5. `src/compiler/ast.ts` — AST node types

## Ground Truth Files
- `/home/methodown/Downloads/GameGui.cs.dso` — Real Tribes 2 compiled DSO (45425 bytes, version 174)
- `/home/methodown/Downloads/BlocklandPortable/base/` — Real Blockland DSO files
- `/home/methodown/t2-linux/console_start.cs` — TorqueScript source for GameGui.cs (2532 lines)
- `/home/methodown/Downloads/engine/console/compiler.cc` — Real Torque engine compiler source (2609 lines, C++)
- `/tmp/dso-sharp/` — Elletra/dso-sharp C# decompiler source (reference implementation)
