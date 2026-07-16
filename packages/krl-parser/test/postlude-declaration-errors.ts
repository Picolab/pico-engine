import test from "ava";
import { ParseError } from "../src/ParseError";
import { parseRuleset } from "../src/krl";
import tokenizer from "../src/tokenizer";

test("rejects declarations in rule postludes", t => {
  const error = t.throws(
    () =>
      parseRuleset(
        tokenizer("ruleset a { rule b { always { x = 3 } } }")
      ),
    { instanceOf: ParseError }
  ) as ParseError;

  t.is(error.message, "Declarations are not allowed in rule postludes");
});
