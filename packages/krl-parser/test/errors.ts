import test from "ava";
import { parse } from "../src/krl";
import tokenizer from "../src/tokenizer";

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
