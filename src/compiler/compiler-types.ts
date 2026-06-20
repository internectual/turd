// compiler-types.ts — Shared types for the compiler

export interface StringTableEntry {
  string: string;
  start: number;
  len: number;
  tag: boolean;
}

export class StringTable {
  entries: StringTableEntry[] = [];
  private stringToIndex: Map<string, number> = new Map();
  totalLen = 0;

  add(str: string, caseSens: boolean, tag: boolean): number {
    const key = caseSens ? str : str.toLowerCase();
    if (this.stringToIndex.has(key)) return this.stringToIndex.get(key)!;
    const len = tag && str.length + 1 < 7 ? 7 : str.length + 1;
    const entry: StringTableEntry = { string: str, start: this.totalLen, len, tag };
    this.entries.push(entry);
    this.totalLen += len;
    this.stringToIndex.set(key, entry.start);
    return entry.start;
  }
}

export class IdentTable {
  identMap: Map<number, number[]> = new Map();
  ipToIdentMap: Map<number, string> = new Map();
  globalStringTable?: StringTable;

  add(strTable: StringTable, ident: string, ip: number): void {
    const targetTable = this.globalStringTable ?? strTable;
    const index = targetTable.add(ident, false, false);
    if (this.identMap.has(index)) {
      this.identMap.get(index)!.push(ip);
    } else {
      this.identMap.set(index, [ip]);
    }
    this.ipToIdentMap.set(ip, ident);
  }

  reset(): void {
    this.identMap.clear();
    this.ipToIdentMap.clear();
  }
}

export class CompileContext {
  codeStream: number[];
  lineBreakPairs: number[];
  ip = 0;
  continuePoint = 0;
  breakPoint = 0;

  constructor(codeSize: number, lineBreakPairSize: number) {
    this.codeStream = new Array(codeSize).fill(0);
    this.lineBreakPairs = new Array(lineBreakPairSize).fill(0);
  }
}
