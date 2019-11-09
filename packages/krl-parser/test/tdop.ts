import test from "ava";
import { parseExpression } from "../src/tdop";
import tokenizer from "../src/tokenizer";
import * as ast from "../src/types";

function rmLoc({ loc, ...rest }: ast.Node): Omit<ast.Node, "loc"> {
  return { ...rest };
}

function parseE(src: string) {
  return rmLoc(parseExpression(tokenizer(src)));
}

test("parser - basic expression", async t => {
  t.deepEqual(parseExpression(tokenizer("123")), {
    loc: { start: 0, end: 3 },
    type: "Number",
    value: 123
  });

  t.deepEqual(parseExpression(tokenizer('"abcd"')), {
    loc: { start: 0, end: 6 },
    type: "String",
    value: "abcd"
  });

  t.deepEqual(parseExpression(tokenizer('"abcd"')), {
    loc: { start: 0, end: 6 },
    type: "String",
    value: "abcd"
  });

  t.deepEqual(parseExpression(tokenizer("re#one#")), {
    loc: { start: 0, end: 7 },
    type: "RegExp",
    value: /one/
  });

  t.deepEqual(parseExpression(tokenizer("re#one#ig")), {
    loc: { start: 0, end: 9 },
    type: "RegExp",
    value: /one/gi
  });

  t.deepEqual(parseE("re#one#i"), {
    type: "RegExp",
    value: /one/i
  });

  t.deepEqual(parseE("re#^one(/two)? .* $#ig"), {
    type: "RegExp",
    value: /^one(\/two)? .* $/gi
  });

  t.deepEqual(parseE("re#\\# else\\\\#ig"), {
    type: "RegExp",
    value: /# else\\/gi
  });

  t.deepEqual(parseE("re#/ok/g#ig"), {
    type: "RegExp",
    value: /\/ok\/g/gi
  });

  t.deepEqual(parseE("re##"), {
    type: "RegExp",
    value: new RegExp("", "")
  });
});
