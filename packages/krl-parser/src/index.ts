import { parseRuleset } from "../src/tdop";
import tokenizer from "../src/tokenizer";
const lineColumn = require("line-column");
const excerptAtLineCol = require("excerpt-at-line-col");

function mkWhere(src: string, line: number, col: number, filename: string) {
  return {
    filename,
    line,
    col,
    locationString: filename + ":" + line + ":" + col,
    excerpt: excerptAtLineCol(src, line - 1, col - 1, 3),
    excerptOneLine: excerptAtLineCol(src, line - 1, col - 1, 0)
  };
}

function parseKRL(src: string, opts?: { filename?: string }) {
  opts = opts || {};

  try {
    const tokens = tokenizer(src);
    const tree = parseRuleset(tokens);
    return tree;
  } catch (e) {
    if (e && e.token && e.token.loc) {
      const lc = lineColumn(src, e.token.loc.start);
      if (lc) {
        e.where = mkWhere(src, lc.line, lc.col, opts.filename || "");
      }
    }
    throw e;
  }
}

export = parseKRL;
