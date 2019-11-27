import { parse } from "./krl";
import tokenizer from "../src/tokenizer";

function parseKRL(src: string, opts?: { filename?: string }) {
  opts = opts || {};

  try {
    const tokens = tokenizer(src);
    const tree = parse(tokens);
    return tree;
  } catch (e) {
    if (e && e.setupWhere) {
      e.setupWhere(src, opts.filename || "");
    }
    throw e;
  }
}

export = parseKRL;
