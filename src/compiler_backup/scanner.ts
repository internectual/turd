// scanner.ts — TorqueScript lexer

export enum TokenType {
  // Keywords
  Datablock, Package, Function, If, Else, Switch, Case,
  Return, Break, New, While, For, True, False, Default,
  // Operators
  Plus, Minus, Multiply, Divide, Modulus,
  Assign, PlusAssign, MinusAssign, MultiplyAssign,
  OrAssign, AndAssign, XorAssign, ModulusAssign, DivideAssign,
  ShiftLeftAssign, ShiftRightAssign,
  LessThan, GreaterThan, LessThanEqual, GreaterThanEqual,
  Not, NotEqual, Equal, Tilde,
  StringEquals, StringNotEquals,
  Concat, SpaceConcat, TabConcat, NewlineConcat,
  Continue, LogicalAnd, LogicalOr,
  LeftBitShift, RightBitShift,
  BitwiseAnd, BitwiseOr, BitwiseXor,
  // Literals
  Label, Int, HexInt, Float, String, TaggedString,
  // Delimiters
  LParen, RParen, LBracket, RBracket,
  Comma, Semicolon, Colon, DoubleColon,
  LeftSquareBracket, RightSquareBracket,
  Dollar, Dot, QuestionMark, Or,
  PlusPlus, MinusMinus,
  // Special
  Eof, Comment, Unknown,
}

export interface Token {
  type: TokenType;
  lexeme: string;
  literal: any;
  line: number;
  position: number;
}

export function makeToken(type: TokenType, lexeme: string, literal: any, line: number, position: number): Token {
  return { type, lexeme, literal, line, position };
}

const KEYWORDS: Record<string, TokenType> = {
  datablock: TokenType.Datablock,
  package: TokenType.Package,
  function: TokenType.Function,
  if: TokenType.If,
  else: TokenType.Else,
  while: TokenType.While,
  for: TokenType.For,
  break: TokenType.Break,
  continue: TokenType.Continue,
  case: TokenType.Case,
  switch: TokenType.Switch,
  return: TokenType.Return,
  new: TokenType.New,
  true: TokenType.True,
  false: TokenType.False,
  default: TokenType.Default,
  or: TokenType.Or,
};

export class Scanner {
  private source: string;
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;

  constructor(source: string) {
    this.source = source;
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }
    this.tokens.push({ type: TokenType.Eof, lexeme: '', literal: null, line: this.line, position: this.current });
    return this.tokens;
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private scanToken(): void {
    const c = this.advance();
    switch (c) {
      case '(': this.addToken(TokenType.LParen); break;
      case ')': this.addToken(TokenType.RParen); break;
      case '{': this.addToken(TokenType.LBracket); break;
      case '}': this.addToken(TokenType.RBracket); break;
      case ',': this.addToken(TokenType.Comma); break;
      case ';': this.addToken(TokenType.Semicolon); break;
      case '[': this.addToken(TokenType.LeftSquareBracket); break;
      case ']': this.addToken(TokenType.RightSquareBracket); break;
      case '.': this.addToken(TokenType.Dot); break;
      case '?': this.addToken(TokenType.QuestionMark); break;
      case '~': this.addToken(TokenType.Tilde); break;
      case '^': this.addToken(this.match('=') ? TokenType.XorAssign : TokenType.BitwiseXor); break;
      case '%': this.addToken(this.match('=') ? TokenType.ModulusAssign : TokenType.Modulus); break;
      case ':':
        this.addToken(this.match(':') ? TokenType.DoubleColon : TokenType.Colon);
        break;
      case '+':
        if (this.match('=')) this.addToken(TokenType.PlusAssign);
        else if (this.match('+')) this.addToken(TokenType.PlusPlus);
        else this.addToken(TokenType.Plus);
        break;
      case '-':
        if (this.match('=')) this.addToken(TokenType.MinusAssign);
        else if (this.match('-')) this.addToken(TokenType.MinusMinus);
        else this.addToken(TokenType.Minus);
        break;
      case '*':
        this.addToken(this.match('=') ? TokenType.MultiplyAssign : TokenType.Multiply);
        break;
      case '/':
        if (this.match('/')) {
          // Line comment
          while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
        } else if (this.match('*')) {
          // Block comment
          while (!(this.peek() === '*' && this.peekNext() === '/') && !this.isAtEnd()) {
            if (this.peek() === '\n') this.line++;
            this.advance();
          }
          if (!this.isAtEnd()) { this.advance(); this.advance(); }
        } else {
          this.addToken(this.match('=') ? TokenType.DivideAssign : TokenType.Divide);
        }
        break;
      case '@': this.addToken(TokenType.Concat); break;
      case '$':
        this.addToken(this.match('=') ? TokenType.StringEquals : TokenType.Dollar);
        break;
      case '&':
        if (this.match('=')) this.addToken(TokenType.AndAssign);
        else if (this.match('&')) this.addToken(TokenType.LogicalAnd);
        else this.addToken(TokenType.BitwiseAnd);
        break;
      case '|':
        if (this.match('=')) this.addToken(TokenType.OrAssign);
        else if (this.match('|')) this.addToken(TokenType.LogicalOr);
        else this.addToken(TokenType.BitwiseOr);
        break;
      case '!':
        if (this.match('=')) this.addToken(TokenType.NotEqual);
        else this.addToken(TokenType.Not);
        break;
      case '=':
        this.addToken(this.match('=') ? TokenType.Equal : TokenType.Assign);
        break;
      case '<':
        if (this.match('=')) this.addToken(TokenType.LessThanEqual);
        else if (this.match('<')) this.addToken(this.match('=') ? TokenType.ShiftLeftAssign : TokenType.LeftBitShift);
        else this.addToken(TokenType.LessThan);
        break;
      case '>':
        if (this.match('=')) this.addToken(TokenType.GreaterThanEqual);
        else if (this.match('>')) this.addToken(this.match('=') ? TokenType.ShiftRightAssign : TokenType.RightBitShift);
        else this.addToken(TokenType.GreaterThan);
        break;
      case '"': this.readString('"'); break;
      case "'": this.readString("'"); break;
      case ' ': case '\r': case '\t': break;
      case '\n': this.line++; break;
      default:
        if (this.isDigit(c)) {
          this.readNumber(c);
        } else if (this.isAlpha(c)) {
          this.readIdentifier();
        }
        break;
    }
  }

  private readString(delimiter: string): void {
    let escaped = false;
    while ((this.peek() !== delimiter || escaped) && !this.isAtEnd()) {
      if (this.peek() === '\n') this.line++;
      if (this.peek() === '\\' && !escaped) escaped = true;
      else escaped = false;
      this.advance();
    }
    if (this.isAtEnd()) return;
    this.advance(); // closing quote
    const raw = this.source.substring(this.start + 1, this.current - 1);
    const value = this.unescape(raw);
    const type = delimiter === "'" ? TokenType.TaggedString : TokenType.String;
    this.addToken(type, value);
  }

  private unescape(s: string): string {
    const map: [string, string][] = [
      ['\\\\', '\\'], ["\\'", "'"], ['\\"', '"'], ['\\t', '\t'], ['\\n', '\n'], ['\\r', '\r'],
    ];
    for (const [from, to] of map) {
      s = s.split(from).join(to);
    }
    // Handle \xNN hex escapes
    return s.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  private readNumber(first: string): void {
    let isFloat = false;
    if (first === '0' && (this.peek() === 'x' || this.peek() === 'X')) {
      this.advance();
      while (this.isHexDigit(this.peek())) this.advance();
      this.addToken(TokenType.HexInt, this.source.substring(this.start, this.current));
      return;
    }
    while (this.isDigit(this.peek())) this.advance();
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      isFloat = true;
      this.advance();
      while (this.isDigit(this.peek())) this.advance();
    }
    if (this.peek() === 'e' || this.peek() === 'E') {
      isFloat = true;
      this.advance();
      if (this.peek() === '+' || this.peek() === '-') this.advance();
      while (this.isDigit(this.peek())) this.advance();
    }
    this.addToken(isFloat ? TokenType.Float : TokenType.Int,
      isFloat ? parseFloat(this.source.substring(this.start, this.current)) : parseInt(this.source.substring(this.start, this.current), 10));
  }

  private readIdentifier(): void {
    while (this.isAlphaNumeric(this.peek())) this.advance();
    const text = this.source.substring(this.start, this.current);
    const kw = KEYWORDS[text];
    if (kw !== undefined) {
      this.addToken(kw, text);
    } else if (text === 'SPC') {
      this.addToken(TokenType.SpaceConcat, text);
    } else if (text === 'TAB') {
      this.addToken(TokenType.TabConcat, text);
    } else if (text === 'NL') {
      this.addToken(TokenType.NewlineConcat, text);
    } else {
      this.addToken(TokenType.Label, text);
    }
  }

  private advance(): string {
    return this.source[this.current++];
  }

  private peek(): string {
    return this.isAtEnd() ? '\0' : this.source[this.current];
  }

  private peekNext(): string {
    return this.current + 1 >= this.source.length ? '\0' : this.source[this.current + 1];
  }

  private match(expected: string): boolean {
    if (this.isAtEnd() || this.source[this.current] !== expected) return false;
    this.current++;
    return true;
  }

  private addToken(type: TokenType, literal: any = null): void {
    const lexeme = this.source.substring(this.start, this.current);
    this.tokens.push({ type, lexeme, literal, line: this.line, position: this.start });
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isHexDigit(c: string): boolean {
    return this.isDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }
}
