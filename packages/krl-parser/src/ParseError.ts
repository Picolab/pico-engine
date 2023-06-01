import { Token } from "./types";
const lineColumn = require("line-column");
const excerptAtLineCol = require("excerpt-at-line-col");

export class ParseError extends Error {
  public token: Token;

  constructor(message: string, token: Token) {
    super(message);
    this.name = "ParseError";
    this.token = token;
  }

  where?: {
    filename: string;
    line: number;
    col: number;
    locationString: string;
    excerpt: string;
    excerptOneLine: string;
  };

  setupWhere(src: string, filename: string) {
    const { line, col } = lineColumn(
      src,
      Math.min(this.token.loc.start, src.length - 1)
    );

    this.where = {
      filename,
      line,
      col,
      locationString: filename + ":" + line + ":" + col,
      excerpt: excerptAtLineCol(src, line - 1, col - 1, 3),
      excerptOneLine: excerptAtLineCol(src, line - 1, col - 1, 0)
    };
  }
}
