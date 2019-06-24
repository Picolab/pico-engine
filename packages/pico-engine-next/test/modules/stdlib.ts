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
});
