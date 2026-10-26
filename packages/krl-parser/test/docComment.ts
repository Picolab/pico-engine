import test from "ava";
import { parseDocComment } from "../src/docComment";
import tokenizer from "../src/tokenizer";
import { parseRuleset } from "../src/krl";
import { ParseError } from "../src/ParseError";
const rmLoc = require("./helpers/rmLoc");

test("parseDocComment preserves blank lines as paragraph breaks", t => {
  const src = `/** First paragraph line one.
   * Line two.
   *
   * Second paragraph.
   * @attr x String
   */`;
  const tok = tokenizer(src).find(x => x.type === "BLOCK-COMMENT")!;
  const doc = parseDocComment(tok);
  t.is(
    doc.description,
    "First paragraph line one. Line two.\n\nSecond paragraph."
  );
});

test("parseDocComment description and tags", t => {
  const src = `/** Create a thing.
   * @attr name String "display name"
   * @returns Map
   */`;
  const tok = tokenizer(src).find(x => x.type === "BLOCK-COMMENT")!;
  const doc = parseDocComment(tok);
  t.is(doc.description, "Create a thing.");
  t.is(doc.tags.length, 2);
  t.deepEqual(doc.tags[0], {
    kind: "attr",
    name: "name",
    type: "String",
    optional: false,
    description: "display name"
  });
  t.deepEqual(doc.tags[1], {
    kind: "returns",
    type: "Map",
    description: undefined
  });
});

test("unknown doc tag is ignored and recorded", t => {
  const tok = tokenizer(`/** Note.
   * @atr foo
   * @attr name String
   */`).find(x => x.type === "BLOCK-COMMENT")!;
  const doc = parseDocComment(tok);
  t.is(doc.tags.length, 1);
  t.deepEqual(doc.unknownTags, [{ name: "atr", rest: "foo" }]);
});

test("doc on rule and shared function", t => {
  const src = `
    meta { shares ping }
    global {
      /** Reply with pong.
       * @returns String */
      ping = function() { "pong" }
    }
  /** Handle open. */
  rule on_open {}
  `;
  const rs = parseRuleset(tokenizer(`ruleset io.test {${src}}`));
  t.is(rs.rules[0].doc?.description, "Handle open.");
  t.is(rs.global[0].doc?.description, "Reply with pong.");
  t.is(rs.global[0].doc?.tags[0].kind, "returns");
});

test("ordinary block comment before rule does not attach", t => {
  const rs = parseRuleset(
    tokenizer(`ruleset a { /* not doc */ rule r {} }`)
  );
  t.is(rs.rules[0].doc, undefined);
});

test("doc not immediately before rule errors", t => {
  const err = t.throws(() =>
    parseRuleset(tokenizer(`ruleset a { /** oops */ }`))
  ) as ParseError;
  t.true(err.message.includes("immediately precede"));
});

test("parseDocComment @example name and JSON map", t => {
  const tok = tokenizer(`/** Send.
   * @example "same engine" { "wellKnown_Tx": "<eci>" }
   * @example "Layer 2" { "layer2": true, "target_did": "<did>" }
   */`).find(x => x.type === "BLOCK-COMMENT")!;
  const doc = parseDocComment(tok);
  t.is(doc.tags.length, 2);
  t.is(doc.tags[0].kind, "example");
  if (doc.tags[0].kind === "example") {
    t.is(doc.tags[0].name, "same engine");
    t.deepEqual(doc.tags[0].data, { wellKnown_Tx: "<eci>" });
  }
});

test("@example invalid JSON is a parse error", t => {
  const tok = tokenizer(`/** @example "bad" { not json } */`).find(
    x => x.type === "BLOCK-COMMENT"
  )!;
  const err = t.throws(() => parseDocComment(tok)) as ParseError;
  t.true(err.message.includes("invalid"));
});

test("JSDoc on unshared global is ignored (no parse error on @returns)", t => {
  const rs = parseRuleset(
    tokenizer(`ruleset io.test {
      global {
        /** Helper. @returns String */
        helper = function() { "x" }
      }
    }`)
  );
  t.is(rs.global[0].doc, undefined);
});
