// test_debug5.ts - Step by step decompiler test
import { readFileSync } from 'fs';
import { BinaryReader } from './src/binary-reader';
import { FileLoader } from './src/file-loader';
import { OPS_MAPS } from './src/opcodes';
import { BytecodeReader } from './src/bytecode-reader';
import { Disassembler } from './src/disassembler';
import { ControlFlowAnalyzer } from './src/control-flow';
import { Builder } from './src/ast';
import { CodeGenerator } from './src/codegen';

const file = process.argv[2] || '/home/methodown/Downloads/mechina/herc_scripts/gui/IPJoinDlg.gui.dso';
const engineId = 'Tribes2';

const buffer = readFileSync(file);
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
const name = file.split('/').pop()!;

console.log(`File: ${name} (${buffer.length} bytes)`);

// Step 1: Load
console.time('load');
const reader = new BinaryReader(arrayBuffer);
const loader = new FileLoader(reader);
const fileData = loader.load();
console.timeEnd('load');
console.log(`Code: ${fileData.code.length} entries, Identifiers: ${fileData.identifierTable.size}`);

// Step 2: Disassemble
console.time('disassemble');
const ops = OPS_MAPS[engineId];
const bcReader = new BytecodeReader(fileData, ops);
const disassembler = new Disassembler();
const disassembly = disassembler.disassemble(bcReader);
console.timeEnd('disassemble');
console.log(`Instructions: ${disassembly.count}, Branches: ${disassembly.branches.length}`);

// Step 3: Control flow
console.time('controlflow');
const cfAnalyzer = new ControlFlowAnalyzer();
const cfData = cfAnalyzer.analyze(disassembly);
console.timeEnd('controlflow');
console.log(`Blocks: ${cfData.blocks.size}, Branches: ${cfData.branches.size}`);

// Step 4: AST
console.time('ast');
const builder = new Builder();
const nodes = builder.build(cfData, disassembly);
console.timeEnd('ast');
console.log(`AST nodes: ${nodes.length}`);

// Step 5: Generate
console.time('codegen');
const codegen = new CodeGenerator();
const output = codegen.generate(nodes);
console.timeEnd('codegen');
console.log(`Output: ${output.length} chars`);
console.log(`\nFirst 1000 chars:\n${output.substring(0, 1000)}`);
