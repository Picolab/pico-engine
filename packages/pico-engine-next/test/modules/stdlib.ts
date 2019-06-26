import test from "ava";
import * as _ from "lodash";
import mkKrl, * as krl from "../../src/krl";
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

test("klog", async t => {
  let lastLine: string = "";
  const callLib = await mkCallLib(line => {
    lastLine = line;
  });

  t.is(lastLine, "");
  t.is(callLib("klog", 42), 42);
  const data = JSON.parse(lastLine);
  t.is(typeof data.time, "string");
  t.is(typeof data.picoId, "string");
  delete data.time;
  delete data.picoId;
  t.deepEqual(data, {
    level: 40,
    msg: "klog",
    rid: "rs.to.get.ctx",
    val: 42
  });
});

test("sprintf", async t => {
  const callLib = await mkCallLib();

  t.is(callLib("sprintf", 0.25), "");
  t.is(callLib("sprintf", 0.25, "That is %s"), "That is %s");
  t.is(callLib("sprintf", 0.25, "%d = %d"), "0.25 = 0.25");
  t.is(callLib("sprintf", 0.25, "\\%s%d\\\\n = .25%s"), "\\%s0.25\\n = .25%s");
  t.is(callLib("sprintf", 0.25, "%\\d%d\\\\\\%dd\\n"), "%\\d0.25\\%dd\\n");
  t.is(callLib("sprintf", function() {}, "One %s"), "One %s");

  t.is(callLib("sprintf", "Bob"), "");
  t.is(callLib("sprintf", "Bob", "Yo"), "Yo");
  t.is(callLib("sprintf", "Bob", "%s is %s"), "Bob is Bob");
  t.is(
    callLib("sprintf", "Bob", "\\%d%s\\\\n is Bob%d"),
    "\\%dBob\\n is Bob%d"
  );
  t.is(callLib("sprintf", "Bob", "%\\s%s\\\\\\%ss\\n"), "%\\sBob\\%ss\\n");
  t.is(callLib("sprintf", function() {}, "Hi %s!"), "Hi %s!");
  t.is(callLib("sprintf", {}, "Hey."), "Hey.");
});

test("number operators", async t => {
  const callLib = await mkCallLib();

  t.is(callLib("chr", 74), "J");
  t.is(callLib("chr", "no"), null);

  t.deepEqual(callLib("range", 0, 0), [0]);
  t.deepEqual(callLib("range", "0", 10), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  t.deepEqual(callLib("range", 1, "-6"), [1, 0, -1, -2, -3, -4, -5, -6]);
  t.deepEqual(callLib("range", "-1.5", "-3.5"), [-1.5, -2.5, -3.5]);
  t.deepEqual(callLib("range", -4), []);
  t.deepEqual(callLib("range", -4, function() {}), []);
  t.deepEqual(callLib("range", null, 0), [0], "range auto convert null -> 0");
  t.deepEqual(
    callLib("range", 0, [1, 2, 3]),
    [0, 1, 2, 3],
    "0.range(.length())"
  );
});

test("defaultsTo - testing debug logging", async t => {
  let lastLine: string = "";
  const callLib = await mkCallLib(line => {
    lastLine = line;
  });

  t.is(callLib("defaultsTo", null, 42), 42, "no message to log");
  t.is(lastLine, "");

  t.true(
    _.isNaN(callLib("defaultsTo", null, NaN, "message 1")),
    "should emit debug"
  );
  t.is(JSON.parse(lastLine).level, 50);
  t.is(JSON.parse(lastLine).msg, "[DEFAULTSTO] message 1");
  lastLine = "";

  t.is(
    callLib("defaultsTo", null, 42, function() {}),
    42,
    "message should use KRL toString rules"
  );
  t.is(JSON.parse(lastLine).msg, "[DEFAULTSTO] [JSObject]");
  lastLine = "";

  t.is(callLib("defaultsTo", null, 42, NaN), 42, "no message to log");
  t.deepEqual(callLib("defaultsTo", [void 0]), [void 0]);
  t.is(callLib("defaultsTo", null), void 0);

  t.is(lastLine, "");
});

test("string operators", async t => {
  const callLib = await mkCallLib();

  t.is(callLib("capitalize", "lower"), "Lower");
  t.is(callLib("capitalize", ""), "");
  t.is(callLib("capitalize", " l"), " l");

  t.deepEqual(callLib("decode", "[1,2,3]"), [1, 2, 3]);
  t.deepEqual(
    callLib("decode", [1, 2, null]),
    [1, 2, null],
    "if not a string, return it"
  );
  t.is(callLib("decode", void 0), void 0, "if not a string, just return it");
  t.is(callLib("decode", "[1,2"), "[1,2", "if parse fails, just return it");
  t.is(callLib("decode", "[1 2]"), "[1 2]", "if parse fails, just return it");

  t.deepEqual(callLib("extract", "3 + 2 - 1"), []);
  t.deepEqual(callLib("extract", "3 + 2 - 1", /([0-9])/g), ["3", "2", "1"]);
  t.deepEqual(callLib("extract", "no-match", /([0-9])/g), []);
  t.deepEqual(callLib("extract", "This is a string", /(is)/), ["is"]);
  t.deepEqual(callLib("extract", "This is a string", /(s.+).*(.ing)/), [
    "s is a st",
    "ring"
  ]);
  t.deepEqual(callLib("extract", "This is a string", /(boot)/), []);
  t.deepEqual(callLib("extract", "I like cheese", /like (\w+)/), ["cheese"]);
  t.deepEqual(callLib("extract", "I like cheese", /(e)/g), [
    "e",
    "e",
    "e",
    "e"
  ]);
  t.deepEqual(
    callLib("extract", "I like cheese", "(ch.*)"),
    ["cheese"],
    "convert strings to RegExp"
  );
  t.deepEqual(callLib("extract", "what the null?", /null/), []);
  t.deepEqual(callLib("extract", "what the null?", void 0), []);

  t.is(callLib("lc", "UppER"), "upper");
  t.is(callLib("uc", "loWer"), "LOWER");

  t.is(callLib("match", "3 + 2 - 1", "([0-9])"), true);
  t.is(callLib("match", "no-match", /([0-9])/g), false);
  t.is(callLib("match", "1", 1), false);
  t.is(callLib("match", 0, /0/), true);
  t.is(callLib("match", "$", new RegExp("$$$", "")), true);

  t.is(callLib("ord", ""), null);
  t.is(callLib("ord", "a"), 97);
  t.is(callLib("ord", "bill"), 98);
  t.is(callLib("ord", "0"), 48);

  t.deepEqual(callLib("split", "a;b;3;4;", /;/), ["a", "b", "3", "4", ""]);
  t.deepEqual(callLib("split", "a;b;3;4;", ""), [
    "a",
    ";",
    "b",
    ";",
    "3",
    ";",
    "4",
    ";"
  ]);
  t.deepEqual(callLib("split", "33a;b;3;4;", 3), ["", "", "a;b;", ";4;"]);

  t.is(callLib("substr", "This is a string", 5), "is a string");
  t.is(callLib("substr", "This is a string", 5, null), "is a string");
  t.is(callLib("substr", "This is a string", 5, "4"), "is a");
  t.is(callLib("substr", "This is a string", "5", -5), "is a s");
  t.is(callLib("substr", "This is a string", "5", "-15"), "his ");
  t.is(callLib("substr", "This is a string", 5, -18), "This ");
  t.is(callLib("substr", "This is a string", 0, 25), "This is a string");
  t.is(callLib("substr", "This is a string", 1, 25), "his is a string");
  t.is(callLib("substr", "This is a string", 16, 0), "");
  t.is(callLib("substr", "This is a string", 16, -1), "g");
  t.is(callLib("substr", "This is a string", 25), "");
  t.is(callLib("substr", ["Not a string", void 0]), "[Array]");
  t.is(callLib("substr", void 0, "Not an index", 2), "null");

  t.is(callLib("trimLeading", " \n\t hi \n\t "), "hi \n\t ");
  t.is(callLib("trimTrailing", " \n\t hi \n\t "), " \n\t hi");
  t.is(callLib("trim", " \n\t hi \n\t "), "hi");
  t.is(callLib("trimLeading", {}), "[Map]");
  t.is(callLib("trimTrailing", {}), "[Map]");
  t.is(callLib("trim", {}), "[Map]");

  t.is(callLib("startsWith", "abcd", "ab"), true);
  t.is(callLib("startsWith", "abcd", "b"), false);
  t.is(callLib("startsWith", "ab", "ab"), true);
  t.is(callLib("endsWith", "abcd", "cd"), true);
  t.is(callLib("endsWith", "abcd", "c"), false);
  t.is(callLib("endsWith", "c", "c"), true);
  t.is(callLib("contains", "abcd", "c"), true);
  t.is(callLib("contains", "abcd", "dc"), false);

  t.is(await callLib("replace", "william W.", /W/i), "illiam W.");
  t.is(await callLib("replace", "William W.", /W/g, "B"), "Billiam B.");
  t.is(await callLib("replace", "Sa5m", 5, true), "Satruem");
  t.is(await callLib("replace", [false, void 0], /(?:)/gi), "[Array]");
  t.deepEqual(await callLib("replace", [false, void 0]), [false, void 0]);

  t.is(
    await callLib(
      "replace",
      "start 1 then 2? 3-42 end",
      /(\d+)/g,
      mkKrl.function(["match"], function(match) {
        return parseInt(match, 10) * 2 + "";
      })
    ),
    "start 2 then 4? 6-84 end"
  );

  let didCallCB = false;
  t.is(
    await callLib(
      "replace",
      "1 2 3",
      /(\d)/g,
      mkKrl.function(["match", "p1", "offset", "string"], function(
        match,
        p1,
        offset,
        string
      ) {
        t.is(arguments.length, 4);
        t.is(match, p1);
        t.is(string.substring(offset, offset + p1.length), p1);
        t.is(string, "1 2 3");
        didCallCB = true;
        return parseInt(match, 10) * 2 + "";
      })
    ),
    "2 4 6"
  );
  t.true(didCallCB);
  didCallCB = false;

  t.is(
    await callLib(
      "replace",
      "000abc333???wat",
      /([a-z]+)(\d*)([^\w]*)/,
      mkKrl.function(["match", "p1", "p2", "p3", "offset", "string"], function(
        match,
        p1,
        p2,
        p3,
        offset,
        string
      ) {
        t.is(arguments.length, 6);
        t.is(match, "abc333???");
        t.is(p1, "abc");
        t.is(p2, "333");
        t.is(p3, "???");
        t.is(offset, 3);
        t.is(string, "000abc333???wat");
        didCallCB = true;
        return "[" + p1 + " - " + p2 + " : " + p3 + "]";
      })
    ),
    "000[abc - 333 : ???]wat"
  );
  t.true(didCallCB);
});

test("collection operators", async t => {
  const callLib = await mkCallLib();
  async function libErrAsync(...args: any[]) {
    const err = await t.throwsAsync((callLib as any).apply(null, args));
    return err + "";
  }

  const a = [3, 4, 5];
  const b = null;
  const c: number[] = [];

  t.true(await callLib("all", []));
  t.true(await callLib("all", {}));
  t.true(await callLib("all", a, mkKrl.function(["x"], x => x < 10)));
  t.false(await callLib("all", a, mkKrl.function(["x"], x => x > 3)));
  t.false(await callLib("all", a, mkKrl.function(["x"], x => x > 10)));
  t.is(await libErrAsync("all", null), "TypeError: only works on collections");

  t.false(await callLib("notall", []));
  t.false(await callLib("notall", {}));
  t.false(await callLib("notall", a, mkKrl.function(["x"], x => x < 10)));
  t.true(await callLib("notall", a, mkKrl.function(["x"], x => x > 3)));
  t.true(await callLib("notall", a, mkKrl.function(["x"], x => x > 10)));
  t.is(
    await libErrAsync("notall", null),
    "TypeError: only works on collections"
  );

  t.false(await callLib("any", []));
  t.false(await callLib("any", {}));
  t.true(await callLib("any", a, mkKrl.function(["x"], x => x < 10)));
  t.true(await callLib("any", a, mkKrl.function(["x"], x => x > 3)));
  t.false(await callLib("any", a, mkKrl.function(["x"], x => x > 10)));
  t.is(await libErrAsync("any", null), "TypeError: only works on collections");

  t.true(await callLib("none", []));
  t.true(await callLib("none", {}));
  t.false(await callLib("none", a, mkKrl.function(["x"], x => x < 10)));
  t.false(await callLib("none", a, mkKrl.function(["x"], x => x > 3)));
  t.true(await callLib("none", a, mkKrl.function(["x"], x => x > 10)));
  t.is(await libErrAsync("none", null), "TypeError: only works on collections");

  t.deepEqual(a, [3, 4, 5], "ensure not mutated");

  t.deepEqual(await callLib("append", ["a", "b"], ["c", "a"]), [
    "a",
    "b",
    "c",
    "a"
  ]);
  t.deepEqual(await callLib("append", ["a", "b"], 10, 11), ["a", "b", 10, 11]);
  t.deepEqual(await callLib("append", 10, 11), [10, 11]);
  t.deepEqual(await callLib("append", a, [6]), [3, 4, 5, 6]);
  t.deepEqual(await callLib("append", a, [[]]), [3, 4, 5, []]);
  t.deepEqual(a, [3, 4, 5], "should not be mutated");
  t.deepEqual(await callLib("append", b, []), [null]);
  t.deepEqual(await callLib("append", b), [null]);
  t.deepEqual(await callLib("append", c, []), []);
  t.deepEqual(await callLib("append", c), []);
  t.deepEqual(await callLib("append", c, [[]]), [[]]);
  t.deepEqual(c, [], "should not be mutated");
  t.deepEqual(await callLib("append", ["a"], "b"), ["a", "b"]);
  t.deepEqual(
    await callLib("append", [{ 0: "a" }, "b"]),
    [{ 0: "a" }, "b"],
    "object that looks like an array, is not auto-magically converted to an array"
  );
  t.deepEqual(await callLib("append", [["a"]], "b"), [["a"], "b"]);
  t.deepEqual(await callLib("append", null, "b"), [null, "b"]);
  t.deepEqual(await callLib("append", [null], "b"), [null, "b"]);
  t.deepEqual(await callLib("append", void 0, "b"), [void 0, "b"]);
  t.deepEqual(await callLib("append", [void 0], "b"), [void 0, "b"]);
  t.deepEqual(await callLib("append", [], "b"), ["b"]);
});
