import test from "ava";
import { parse } from "../src/krl";
import tokenizer from "../src/tokenizer";
import { ParseError } from "../src/ParseError";
const mk = require("./helpers/astMaker");
const rmLoc = require("./helpers/rmLoc");
const parseKRL = require("../src/index");

function parseIt(src: string) {
  return rmLoc(parse(tokenizer(src)));
}

test("error messages", t => {
  function parseErr(src: string) {
    const err = t.throws(() => parse(tokenizer(src))) as any;
    return `${err}|${err.token.type}|${err.token.src}|${err.token.loc.start}`;
  }

  t.is(
    parseErr("ruleset a{rule b{fired{ent:c=1}}}"),
    "ParseError: Expected `:=`|RAW|=|28"
  );

  t.is(
    parseErr("ruleset a{rule b{fired{ent:c:=}}}"),
    "ParseError: Expected an expression|RAW|}|30"
  );

  t.is(
    parseErr("ruleset a{rule b{fired{wat}}}"),
    "ParseError: Expected a declaration|SYMBOL|wat|23"
  );

  t.is(
    parseErr("ruleset a{rule b{fired{raise}}}"),
    "ParseError: Expected `event`|RAW|}|28"
  );

  t.is(
    parseErr("ruleset a{global{foo()}}"),
    "ParseError: Expected a declaration|SYMBOL|foo|17"
  );

  t.is(
    parseErr("ruleset a{rule b{pre{foo()}}}"),
    "ParseError: Expected a declaration|SYMBOL|foo|21"
  );

  t.is(
    parseErr("function(){a = one [i]}"),
    "ParseError: Expected the function return expression|RAW|}|22"
  );

  t.is(
    parseErr("function(){a = one {path}}"),
    "ParseError: Expected the function return expression|RAW|}|25"
  );
});

test("potentially ambiguous cases", t => {
  t.deepEqual(
    parseIt(`function(){
              one = 1;
              {"two":one}
            }`),
    [
      {
        type: "Function",
        params: mk.params([]),
        body: [mk.declare("=", mk.id("one"), mk(1))],
        return: mk({ two: mk.id("one") })
      }
    ]
  );

  t.deepEqual(
    parseIt(`function(){
              one = 1;
              [index]
            }`),
    [
      {
        type: "Function",
        params: mk.params([]),
        body: [mk.declare("=", mk.id("one"), mk(1))],
        return: { type: "Array", value: [mk.id("index")] }
      }
    ]
  );

  t.deepEqual(
    parseIt("ruleset a{rule b{choose one{noop()}}}").rules[0].action_block,
    {
      type: "ActionBlock",
      block_type: "choose",
      condition: null,
      discriminant: mk.id("one"),
      actions: [mk.action(null, "noop", [])]
    }
  );

  t.deepEqual(
    parseIt("ruleset a{rule b{choose (one{noop()}) {noop()}}}").rules[0]
      .action_block,
    {
      type: "ActionBlock",
      block_type: "choose",
      condition: null,
      discriminant: mk.get(mk.id("one"), mk.app(mk.id("noop")), "path"),
      actions: [mk.action(null, "noop", [])]
    }
  );
});

test("closing brace errors", t => {
  let err = t.throws(() => parseKRL(`ruleset a{`)) as ParseError;
  t.is(err + "", "ParseError: Expected `}`");
  t.deepEqual(err.token, {
    loc: {
      end: 10,
      start: 10
    },
    src: "",
    type: "WHITESPACE"
  });
  t.deepEqual(err.where, {
    col: 10,
    excerpt: `
ruleset a{
         ^`.trim(),
    excerptOneLine: `
ruleset a{
         ^`.trim(),
    filename: "",
    line: 1,
    locationString: ":1:10"
  });
});
