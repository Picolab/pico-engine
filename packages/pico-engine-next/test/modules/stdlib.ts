import test from "ava";
import mkKrl from "../../src/krl";
import stdlib from "../../src/modules/stdlib";
import { makeKrlCtx } from "../helpers/makeKrlCtx";

async function mkCallLib(onLogLine?: (str: string) => void) {
  const krlCtx = await makeKrlCtx(onLogLine);
  return function callLib(op: string, ...args: any[]) {
    return stdlib[op](krlCtx, args);
  };
}

test("infix operators", async t => {
  let lastLine: string = "";
  const callLib = await mkCallLib(line => {
    lastLine = line;
  });
  function libErr(...args: any[]): string {
    return t.throws(() => (callLib as any).apply(null, args)) + "";
  }

  t.is(callLib("+", 1), 1);
  t.is(callLib("+", -1), -1);
  t.is(callLib("+", 1, 2), 3);
  t.is(callLib("+", 2.3, 0.1), 2.4);
  // concat +
  t.is(callLib("+", 1, null), "1null");
  t.is(callLib("+", null, 1), "null1");
  t.is(callLib("+", 1, false), "1false");
  t.is(callLib("+", false, 1), "false1");
  t.is(callLib("+", function() {}, "foo"), "[JSObject]foo");
  t.is(callLib("+", 1, true), "1true");
  t.is(callLib("+", "wat", 100), "wat100");
  t.is(callLib("+", {}, []), "[Map][Array]");

  t.is(callLib("-", 2), -2);
  t.is(libErr("-", "zero"), "TypeError: Cannot negate zero");
  t.is(callLib("-", [0]), -1);
  t.is(callLib("-", {}), -0);
  t.is(callLib("-", 1, 3), -2);
  t.is(callLib("-", "1", "  3"), -2);
  t.is(callLib("-", 4, 1), 3);
  t.is(libErr("-", "two", 1), "TypeError: 1 cannot be subtracted from two");
  t.is(callLib("-", ["a", "b", "c"], 2), 1);
  t.is(callLib("-", { a: 1, b: 1, c: 1 }, [1]), 2);

  t.is(callLib("*", 5, 2), 10);
  t.is(libErr("*", "two", 1), "TypeError: two cannot be multiplied by 1");
  t.is(
    libErr("*", 1, function() {}),
    "TypeError: 1 cannot be multiplied by [JSObject]"
  );

  t.is(callLib("/", 4, 2), 2);
  t.is(libErr("/", "two", 1), "TypeError: two cannot be divided by 1");
  t.is(callLib("/", "2", 1), 2);
  t.is(
    libErr("/", 1, function() {}),
    "TypeError: 1 cannot be divided by [JSObject]"
  );
  t.is(lastLine, "");
  t.is(callLib("/", 9, 0), 0);
  t.is(JSON.parse(lastLine).msg, "[DIVISION BY ZERO] 9 / 0");

  t.is(callLib("%", 4, 2), 0);
  t.is(callLib("%", "1", "0"), 0);
  t.is(libErr("%", 1, "two"), "TypeError: Cannot calculate 1 modulo two");
  t.is(callLib("%", [1, 2, 3, 4, 5], [1, 2]), 1);
  t.is(
    libErr("%", function() {}, 1),
    "TypeError: Cannot calculate [JSObject] modulo 1"
  );

  // ==
  t.true(callLib("==", null, NaN));
  t.true(callLib("==", NaN, void 0));
  t.true(callLib("==", null, void 0));
  t.true(callLib("==", NaN, NaN));
  t.false(callLib("==", null, 0));
  t.false(callLib("==", 0, null));
  t.false(callLib("==", 0, void 0));
  t.false(callLib("==", false, null));
  t.false(callLib("==", true, 1));
  t.true(callLib("==", { a: ["b"] }, { a: ["b"] }));
  t.false(callLib("==", { a: ["b"] }, { a: ["c"] }));
  t.false(callLib("==", "aaa", "bbb"));
  t.true(callLib("!=", "aaa", "bbb"));

  // <=> is the basis for <, >, <=, >=
  t.is(callLib("<=>", "5", "10"), -1);
  t.is(callLib("<=>", 5, "5"), 0);
  t.is(callLib("<=>", "10", 5), 1);
  t.is(callLib("<=>", NaN, void 0), 0);
  t.is(callLib("<=>", null, 0), 0);
  t.is(callLib("<=>", null, false), 0);
  t.is(callLib("<=>", true, 1), 0);
  t.is(callLib("<=>", true, false), 1);
  t.is(callLib("<=>", [0, 1], [1, 1]), 0);
  t.is(callLib("<=>", 20, 3), 1);
  t.is(callLib("<=>", "20", 3), 1);
  t.is(callLib("<=>", 20, "3"), 1);
  t.is(callLib("<=>", "20", "3"), 1, "parse numbers then compare");
  t.is(callLib("<=>", ".2", 0.02), 1, "parse numbers then compare");
  t.is(callLib("<=>", ["a", "b"], 2), 0, ".length() of arrays");
  t.is(callLib("<=>", { " ": -0.5 }, 1), 0, ".length() of maps");
  t.is(
    callLib("<=>", [1, 2, 3], { a: "b", z: "y", c: "d" }),
    0,
    "compare the .length() of each"
  );

  t.is(
    callLib("<=>", mkKrl.function([], () => null), "[Function]"),
    0,
    "Functions drop down to string compare"
  );
  t.is(
    callLib("<=>", mkKrl.action([], () => null), "[Action]"),
    0,
    "Actions drop down to string compare"
  );
  t.is(
    callLib("<=>", /good/, "re#good#"),
    0,
    "RegExp drop down to string compare"
  );
  t.is(
    callLib("<=>", 1, "a"),
    -1,
    "if both can't be numbers, then string compare"
  );
  t.is(
    callLib("<=>", true, "to"),
    1,
    "if both can't be numbers, then string compare"
  );

  // <, >, <=, >= all use <=> under the hood
  t.is(callLib("<", "3", "20"), true);
  t.is(callLib(">", "a", "b"), false);
  t.is(callLib(">", "2018-03-07", "2018-03-05"), true);
  t.is(callLib(">", "02", "1"), true);
  t.is(callLib("<=", "a", "a"), true);
  t.is(callLib("<=", "a", "b"), true);
  t.is(callLib("<=", "b", "a"), false);
  t.is(callLib(">=", "a", "a"), true);
  t.is(callLib(">=", "a", "b"), false);
  t.is(callLib(">=", "b", "a"), true);

  var obj = {
    colors: "many",
    pi: [3, 1, 4, 1, 5, 9, 3],
    foo: { bar: { "10": "I like cheese" } }
  };
  t.false(callLib("><", obj, "many"));
  t.true(callLib("><", obj, "pi"));
  t.false(callLib("><", obj, "bar"));
  t.deepEqual(
    obj,
    {
      colors: "many",
      pi: [3, 1, 4, 1, 5, 9, 3],
      foo: { bar: { "10": "I like cheese" } }
    },
    "should not be mutated"
  );
  t.true(callLib("><", [5, 6, 7], 6));
  t.false(callLib("><", [5, 6, 7], 2));
  t.false(callLib("><", [], null));
  t.false(callLib("><", {}, void 0));
  t.true(callLib("><", [void 0], NaN));

  t.true(callLib("like", "wat", /a/));
  t.false(callLib("like", "wat", /b/));
  t.false(callLib("like", "wat", "da"));
  t.true(callLib("like", "wat", "a.*?(a|t)"));
  t.true(callLib("like", "atruething", true));

  t.is(callLib("cmp", "aab", "abb"), -1);
  t.is(callLib("cmp", "aab", "aab"), 0);
  t.is(callLib("cmp", "abb", "aab"), 1);
  t.is(callLib("cmp", void 0, NaN), 0, '"null" === "null"');
  t.is(callLib("cmp", "5", "10"), 1);
  t.is(callLib("cmp", 5, "5"), 0);
  t.is(callLib("cmp", "10", 5), -1);
  t.is(callLib("cmp", { "": -0.5 }, { " ": 0.5 }), 0);
  t.is(callLib("cmp", [], [[""]]), 0);
  t.is(callLib("cmp", null, 0), 1);
  t.is(
    callLib("cmp", 20, 3),
    -1,
    "cmp always converts to string then compares"
  );
});

test("type operators", async t => {
  const callLib = await mkCallLib();
  function libErr(...args: any[]): string {
    return t.throws(() => (callLib as any).apply(null, args)) + "";
  }
  t.is(callLib("as", t), t);
  t.is(callLib("as", 1, "String"), "1");
  t.is(callLib("as", 0.32, "String"), "0.32");
  t.is(callLib("as", 0, "String"), "0");
  t.is(callLib("as", null, "String"), "null");
  t.is(callLib("as", void 0, "String"), "null");
  t.is(callLib("as", NaN, "String"), "null");
  t.is(callLib("as", true, "String"), "true");
  t.is(callLib("as", false, "String"), "false");
  t.is(callLib("as", "str", "String"), "str");
  t.is(callLib("as", /^a.*b/, "String"), "re#^a.*b#");
  t.is(callLib("as", /^a.*b/gi, "String"), "re#^a.*b#gi");
  t.is(callLib("as", [1, 2], "String"), "[Array]");
  t.is(callLib("as", {}, "String"), "[Map]");

  t.is(callLib("as", "-1.23", "Number"), -1.23);
  t.is(callLib("as", 42, "Number"), 42);
  t.is(callLib("as", true, "Number"), 1);
  t.is(callLib("as", false, "Number"), 0);
  t.is(callLib("as", null, "Number"), 0);
  t.is(callLib("as", NaN, "Number"), 0);
  t.is(callLib("as", void 0, "Number"), 0);
  t.is(callLib("as", "foo", "Number"), null);
  t.is(callLib("as", {}, "Number"), 0);
  t.is(callLib("as", [1, 2], "Number"), 2);
  t.is(callLib("as", { a: "b", z: "y", c: "d" }, "Number"), 3);
  t.is(callLib("as", "", "Number"), 0);
  t.is(callLib("as", "2018-03-07", "Number"), null);
  t.is(callLib("as", "2018-03-07", "Number"), null);
  t.is(callLib("as", "1,000", "Number"), null);
  t.is(callLib("as", "1,000.25", "Number"), null);
  t.is(callLib("as", "1000.25", "Number"), 1000.25);
  t.is(callLib("as", " 123 ", "Number"), 123);
  t.is(callLib("as", " 1 2 ", "Number"), null);
  t.is(callLib("as", " +5  ", "Number"), 5);
  t.is(callLib("as", " + 5  ", "Number"), null);
  t.is(callLib("as", "0xAF", "Number"), 175);
  t.is(callLib("as", "0o72", "Number"), 58);
  t.is(callLib("as", "0b01101", "Number"), 13);
  t.is(callLib("as", "0b02101", "Number"), null);

  t.is(callLib("as", "^a.*z$", "RegExp").source, /^a.*z$/.source);
  t.is(callLib("as", null, "RegExp").source, "null");
  t.is(callLib("as", 123, "RegExp").source, "123");
  t.is(
    callLib("as", mkKrl.function([], () => null), "RegExp").source,
    "\\[Function\\]"
  );
  t.is(callLib("as", "[Function]", "RegExp").source, "[Function]");

  var testRegex = /^a.*z$/;
  t.is(callLib("as", testRegex, "RegExp"), testRegex);
  t.is(callLib("as", "true", "Boolean"), true);
  t.is(callLib("as", "false", "Boolean"), false);
  t.is(callLib("as", 0, "Boolean"), false);
  t.is(
    libErr("as", "0", "num"),
    'TypeError: Cannot use the .as("num") operator with 0 (type String)'
  );
  t.is(
    libErr("as", {}, /boolean/),
    'TypeError: Cannot use the .as("/boolean/") operator with [Map] (type Map)'
  );

  t.is(callLib("isnull"), true);
  t.is(callLib("isnull", void 0), true);
  t.is(callLib("isnull", null), true);
  t.is(callLib("isnull", NaN), true);
  t.is(callLib("isnull", false), false);
  t.is(callLib("isnull", 0), false);
  t.is(callLib("isnull", ""), false);
  t.is(callLib("isnull", {}), false);

  t.is(callLib("typeof", ""), "String");
  t.is(callLib("typeof", "1"), "String");
  t.is(callLib("typeof", 0), "Number");
  t.is(callLib("typeof", -0.01), "Number");
  t.is(callLib("typeof", 10e10), "Number");
  t.is(callLib("typeof", true), "Boolean");
  t.is(callLib("typeof", false), "Boolean");
  t.is(callLib("typeof", void 0), "Null");
  t.is(callLib("typeof", null), "Null");
  t.is(callLib("typeof", NaN), "Null");
  t.is(callLib("typeof", /a/), "RegExp");
  t.is(callLib("typeof", []), "Array");
  t.is(callLib("typeof", {}), "Map");
  t.is(callLib("typeof", mkKrl.function([], () => null)), "Function");
  t.is(callLib("typeof", mkKrl.action([], () => null)), "Action");
});
