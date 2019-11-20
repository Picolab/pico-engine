import test from "ava";
import { parseExpression, parseRuleset } from "../src/tdop";
import tokenizer from "../src/tokenizer";
import * as ast from "../src/types";

function rmLoc({ loc, ...rest }: ast.Node): any {
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

test("ruleset", async t => {
  t.deepEqual(parseRuleset(tokenizer("ruleset rs {\n}")), {
    type: "Ruleset",
    loc: { start: 0, end: 14 },

    rid: { type: "RulesetID", value: "rs", loc: { start: 8, end: 10 } }

    // meta: void 0,
    // global: [],
    // rules: []
  });
});

test("rulesetID", async t => {
  function parseRID(src: string) {
    try {
      const node = parseRuleset(tokenizer(`ruleset ${src} {}`)).rid;
      if (
        Object.keys(node)
          .sort()
          .join(",") === "loc,type,value" &&
        node.type === "RulesetID" &&
        node.value === src &&
        node.loc.start === 8 &&
        node.loc.end === 8 + src.length
      ) {
        return true;
      }
      return node;
    } catch (err) {
      return `${err}|${err.token.type}|${err.token.src}|${err.token.loc.start}`;
    }
  }

  t.deepEqual(parseRID("rs"), true);
  t.deepEqual(parseRID("one.two.three"), true);

  t.deepEqual(
    parseRID("one.two."),
    "ParseError: RulesetID cannot end with a `.`\nValid ruleset IDs are reverse domain name. i.e. `io.picolabs.some.cool.name`|WHITESPACE| |16"
  );

  t.deepEqual(parseRID("1"), "ParseError: Expected RulesetID|NUMBER|1|8");

  t.deepEqual(parseRID("io.picolabs.some-thing"), true);
  t.deepEqual(parseRID("A.B-b9.c"), true);
  t.deepEqual(parseRID("function.not.ent.app.keys"), true);

  t.deepEqual(parseRID("1.2.3"), "ParseError: Expected RulesetID|NUMBER|1.2|8");
  t.deepEqual(parseRID(".wat"), "ParseError: Expected RulesetID|RAW|.|8");
  t.deepEqual(
    parseRID("io. picolabs"),
    "ParseError: RulesetID cannot end with a `.`\nValid ruleset IDs are reverse domain name. i.e. `io.picolabs.some.cool.name`|WHITESPACE| |11",
    "no spaces"
  );
  t.deepEqual(
    parseRID("some -thing"),
    "ParseError: Expected: {|RAW|-|13",
    "no spaces"
  );
  t.deepEqual(
    parseRID("some- thing"),
    "ParseError: RulesetID cannot end with a `-`\nValid ruleset IDs are reverse domain name. i.e. `io.picolabs.some.cool.name`|WHITESPACE| |13",
    "no spaces"
  );
  t.deepEqual(parseRID("some-thing"), true);
});
