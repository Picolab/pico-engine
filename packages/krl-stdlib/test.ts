import test from "ava";
import * as _ from "lodash";
import * as krl from "./src/krl";
import { KrlCtx } from "./src/KrlCtx";
import { makeKrlLogger } from "./src/KrlLogger";
import stdlib from "./src/stdlib";

async function mkCallLib(onLogLine?: (str: string) => void) {
  const krlCtx: KrlCtx = {
    rsCtx: null as any,
    log: makeKrlLogger(onLogLine ? onLogLine : (line: string) => {}, {
      picoId: "fakeid",
      rid: "rs.to.get.ctx",
    }),
    async getPicoLogs() {
      return [];
    },
    getEvent() {
      return null;
    },
    setEvent(event) {},
    setCurrentRuleName(rn) {},
    getCurrentRuleName() {
      return null;
    },
    getQuery() {
      return null;
    },
    setQuery(query) {},
    module(domain) {
      return null;
    },
    configure(name, dflt) {},
    useModule(rid, alias, configure) {},
    addDirective(name, options) {
      return {
        type: "directive",
        name,
        options: options || {},
        meta: {
          rid: "test",
          rule_name: "test",
          txnId: "test",
        },
      };
    },
    drainDirectives() {
      return [];
    },
    krl,
  };
  return function callLib(op: string, ...args: any[]) {
    return stdlib[op](krlCtx, args);
  };
}

test("infix operators", async (t) => {
  let lastLine: string = "";
  const callLib = await mkCallLib((line) => {
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
  t.is(
    callLib("+", function () {}, "foo"),
    "[JSObject]foo"
  );
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
    libErr("*", 1, function () {}),
    "TypeError: 1 cannot be multiplied by [JSObject]"
  );

  t.is(callLib("/", 4, 2), 2);
  t.is(libErr("/", "two", 1), "TypeError: two cannot be divided by 1");
  t.is(callLib("/", "2", 1), 2);
  t.is(
    libErr("/", 1, function () {}),
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
    libErr("%", function () {}, 1),
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
    callLib(
      "<=>",
      krl.Function([], () => null),
      "[Function]"
    ),
    0,
    "Functions drop down to string compare"
  );
  t.is(
    callLib(
      "<=>",
      krl.Action([], () => null),
      "[Action]"
    ),
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

  const obj = {
    colors: "many",
    pi: [3, 1, 4, 1, 5, 9, 3],
    foo: { bar: { "10": "I like cheese" } },
  };
  t.false(callLib("><", 15, "colors"));
  t.false(callLib("><", obj, "many"));
  t.true(callLib("><", obj, "pi"));
  t.false(callLib("><", obj, "bar"));
  t.deepEqual(
    obj,
    {
      colors: "many",
      pi: [3, 1, 4, 1, 5, 9, 3],
      foo: { bar: { "10": "I like cheese" } },
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

test("type operators", async (t) => {
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
    callLib(
      "as",
      krl.Function([], () => null),
      "RegExp"
    ).source,
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
  t.is(
    callLib(
      "typeof",
      krl.Function([], () => null)
    ),
    "Function"
  );
  t.is(
    callLib(
      "typeof",
      krl.Action([], () => null)
    ),
    "Action"
  );
});

test("klog", async (t) => {
  let lastLine: string = "";
  const callLib = await mkCallLib((line) => {
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
    val: 42,
  });
});

test("sprintf", async (t) => {
  const callLib = await mkCallLib();

  t.is(callLib("sprintf", 0.25), "");
  t.is(callLib("sprintf", 0.25, "That is %s"), "That is %s");
  t.is(callLib("sprintf", 0.25, "%d = %d"), "0.25 = 0.25");
  t.is(callLib("sprintf", 0.25, "\\%s%d\\\\n = .25%s"), "\\%s0.25\\n = .25%s");
  t.is(callLib("sprintf", 0.25, "%\\d%d\\\\\\%dd\\n"), "%\\d0.25\\%dd\\n");
  t.is(
    callLib("sprintf", function () {}, "One %s"),
    "One %s"
  );

  t.is(callLib("sprintf", "Bob"), "");
  t.is(callLib("sprintf", "Bob", "Yo"), "Yo");
  t.is(callLib("sprintf", "Bob", "%s is %s"), "Bob is Bob");
  t.is(
    callLib("sprintf", "Bob", "\\%d%s\\\\n is Bob%d"),
    "\\%dBob\\n is Bob%d"
  );
  t.is(callLib("sprintf", "Bob", "%\\s%s\\\\\\%ss\\n"), "%\\sBob\\%ss\\n");
  t.is(
    callLib("sprintf", function () {}, "Hi %s!"),
    "Hi %s!"
  );
  t.is(callLib("sprintf", {}, "Hey."), "Hey.");
});

test("number operators", async (t) => {
  const callLib = await mkCallLib();

  t.is(callLib("chr", 74), "J");
  t.is(callLib("chr", "no"), null);

  t.deepEqual(callLib("range", 0, 0), [0]);
  t.deepEqual(callLib("range", "0", 10), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  t.deepEqual(callLib("range", 1, "-6"), [1, 0, -1, -2, -3, -4, -5, -6]);
  t.deepEqual(callLib("range", "-1.5", "-3.5"), [-1.5, -2.5, -3.5]);
  t.deepEqual(callLib("range", -4), []);
  t.deepEqual(
    callLib("range", -4, function () {}),
    []
  );
  t.deepEqual(callLib("range", null, 0), [0], "range auto convert null -> 0");
  t.deepEqual(
    callLib("range", 0, [1, 2, 3]),
    [0, 1, 2, 3],
    "0.range(.length())"
  );
});

test("defaultsTo - testing debug logging", async (t) => {
  let lastLine: string = "";
  const callLib = await mkCallLib((line) => {
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
    callLib("defaultsTo", null, 42, function () {}),
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

test("string operators", async (t) => {
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
    "ring",
  ]);
  t.deepEqual(callLib("extract", "This is a string", /(boot)/), []);
  t.deepEqual(callLib("extract", "I like cheese", /like (\w+)/), ["cheese"]);
  t.deepEqual(callLib("extract", "I like cheese", /(e)/g), [
    "e",
    "e",
    "e",
    "e",
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
    ";",
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
      krl.Function(["match"], function (match) {
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
      krl.Function(["match", "p1", "offset", "string"], function (
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
      krl.Function(["match", "p1", "p2", "p3", "offset", "string"], function (
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

test("collection operators", async (t) => {
  const callLib = await mkCallLib();
  async function libErrAsync(...args: any[]) {
    const err = await t.throwsAsync((callLib as any).apply(null, args));
    return err + "";
  }
  function libErr(...args: any[]): string {
    return t.throws(() => (callLib as any).apply(null, args)) + "";
  }

  const a = [3, 4, 5];
  const obj = {
    colors: "many",
    pi: [3, 1, 4, 1, 5, 9, 3],
    foo: { bar: { "10": "I like cheese" } },
  };

  t.true(await callLib("all", []));
  t.true(await callLib("all", {}));
  t.true(
    await callLib(
      "all",
      a,
      krl.Function(["x"], (x) => x < 10)
    )
  );
  t.false(
    await callLib(
      "all",
      a,
      krl.Function(["x"], (x) => x > 3)
    )
  );
  t.false(
    await callLib(
      "all",
      a,
      krl.Function(["x"], (x) => x > 10)
    )
  );
  t.is(await libErrAsync("all", null), "TypeError: only works on collections");

  t.false(await callLib("notall", []));
  t.false(await callLib("notall", {}));
  t.false(
    await callLib(
      "notall",
      a,
      krl.Function(["x"], (x) => x < 10)
    )
  );
  t.true(
    await callLib(
      "notall",
      a,
      krl.Function(["x"], (x) => x > 3)
    )
  );
  t.true(
    await callLib(
      "notall",
      a,
      krl.Function(["x"], (x) => x > 10)
    )
  );
  t.is(
    await libErrAsync("notall", null),
    "TypeError: only works on collections"
  );

  t.false(await callLib("any", []));
  t.false(await callLib("any", {}));
  t.true(
    await callLib(
      "any",
      a,
      krl.Function(["x"], (x) => x < 10)
    )
  );
  t.true(
    await callLib(
      "any",
      a,
      krl.Function(["x"], (x) => x > 3)
    )
  );
  t.false(
    await callLib(
      "any",
      a,
      krl.Function(["x"], (x) => x > 10)
    )
  );
  t.is(await libErrAsync("any", null), "TypeError: only works on collections");

  t.true(await callLib("none", []));
  t.true(await callLib("none", {}));
  t.false(
    await callLib(
      "none",
      a,
      krl.Function(["x"], (x) => x < 10)
    )
  );
  t.false(
    await callLib(
      "none",
      a,
      krl.Function(["x"], (x) => x > 3)
    )
  );
  t.true(
    await callLib(
      "none",
      a,
      krl.Function(["x"], (x) => x > 10)
    )
  );
  t.is(await libErrAsync("none", null), "TypeError: only works on collections");

  t.deepEqual(a, [3, 4, 5], "ensure not mutated");

  t.deepEqual(await callLib("append", ["a", "b"], ["c", "a"]), [
    "a",
    "b",
    "c",
    "a",
  ]);
  t.deepEqual(await callLib("append", ["a", "b"], 10, 11), ["a", "b", 10, 11]);
  t.deepEqual(await callLib("append", 10, 11), [10, 11]);
  t.deepEqual(await callLib("append", a, [6]), [3, 4, 5, 6]);
  t.deepEqual(await callLib("append", a, [[]]), [3, 4, 5, []]);
  t.deepEqual(a, [3, 4, 5], "should not be mutated");
  t.deepEqual(await callLib("append", null, []), [null]);
  t.deepEqual(await callLib("append", null), [null]);
  t.deepEqual(await callLib("append", [], []), []);
  t.deepEqual(await callLib("append", []), []);
  t.deepEqual(await callLib("append", [], [[]]), [[]]);
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

  var fnDontCall = krl.Function([], function () {
    throw new Error();
  });

  var collectFn = krl.Function(["a"], function (a) {
    return stdlib["<"](this, [a, 5]) ? "x" : "y";
  });

  t.deepEqual(await callLib("collect", [7, 4, 3, 5, 2, 1, 6], collectFn), {
    x: [4, 3, 2, 1],
    y: [7, 5, 6],
  });
  t.is(
    await libErrAsync("collect", null, collectFn),
    "TypeError: only works on collections"
  );
  t.deepEqual(await callLib("collect", [], fnDontCall), {});
  t.deepEqual(
    await callLib("collect", [1, 2, 2, 3, 3, 3]),
    {
      1: [1],
      2: [2, 2],
      3: [3, 3, 3],
    },
    "default to the identity function"
  );

  t.deepEqual(
    await callLib(
      "filter",
      a,
      krl.Function(["x"], (x) => x < 5)
    ),
    [3, 4]
  );
  t.deepEqual(
    await callLib(
      "filter",
      a,
      krl.Function(["x"], (x) => x > 5)
    ),
    []
  );
  t.deepEqual(
    await callLib(
      "filter",
      a,
      krl.Function(["x"], (x) => x > 5)
    ),
    []
  );
  t.deepEqual(a, [3, 4, 5], "should not be mutated");
  t.deepEqual(
    await callLib(
      "filter",
      { a: 1, b: 2, c: 3 },
      krl.Function(["x"], (x) => x % 2 !== 0)
    ),
    { a: 1, c: 3 }
  );
  t.deepEqual(
    await callLib(
      "filter",
      { a: 1, b: 2, c: 3 },
      krl.Function(["v", "k"], (v, k) => k === "b")
    ),
    { b: 2 }
  );

  t.is(callLib("head", a), 3);
  t.deepEqual(a, [3, 4, 5], "should not be mutated");
  t.is(callLib("head", [null, {}]), null);
  t.is(callLib("head", "string"), "string");
  t.deepEqual(callLib("head", { "0": null }), { "0": null });
  t.is(callLib("head", []), void 0);

  t.deepEqual(callLib("tail", a), [4, 5]);
  t.deepEqual(a, [3, 4, 5], "should not be mutated");
  t.deepEqual(callLib("tail", { a: 1, b: 2 }), []);
  t.deepEqual(callLib("tail", "string"), []);

  t.is(callLib("index", a, 5), 2);
  t.deepEqual(a, [3, 4, 5], "should not be mutated");
  t.is(callLib("index", [0, null], NaN), 1);
  t.is(
    callLib(
      "index",
      [
        [[0], 0],
        [0, [0]],
        [[0], 0],
        [0, [0]],
      ],
      [0, [0]]
    ),
    1
  );
  t.is(libErr("index", { a: 1 }), "TypeError: only works on Arrays");

  t.is(callLib("join", a, ";"), "3;4;5");
  t.is(callLib("join", a), "3,4,5", "default to ,");
  t.deepEqual(a, [3, 4, 5], "should not be mutated");
  t.is(callLib("join", null), "null");
  t.is(callLib("join", NaN), "null");
  t.is(callLib("join", ["<", ">"], /|/), "<re#|#>");

  t.is(callLib("length", a), 3);
  t.is(callLib("length", [void 0, 7]), 2);
  t.is(callLib("length", '"'), 1);
  t.is(callLib("length", /'/), 0);
  t.is(
    callLib("length", function () {}),
    0
  );

  t.is(callLib("isEmpty", null), true);
  t.is(callLib("isEmpty", void 0), true);
  t.is(callLib("isEmpty", NaN), true);
  t.is(callLib("isEmpty", 0), true);
  t.is(callLib("isEmpty", 1), true);
  t.is(callLib("isEmpty", true), true);
  t.is(callLib("isEmpty", []), true);
  t.is(callLib("isEmpty", [1, 2]), false);
  t.is(callLib("isEmpty", {}), true);
  t.is(callLib("isEmpty", { a: 1 }), false);
  t.is(callLib("isEmpty", ""), true);
  t.is(callLib("isEmpty", " "), false);
  t.is(
    callLib("isEmpty", function () {}),
    true
  );

  t.deepEqual(
    await callLib(
      "map",
      a,
      krl.Function(["x"], (x) => x + 2)
    ),
    [5, 6, 7]
  );
  t.deepEqual(a, [3, 4, 5], "should not be mutated");
  t.deepEqual(await callLib("map", [3, 4, void 0]), [3, 4, void 0]);
  t.deepEqual(await callLib("map", [], fnDontCall), []);
  t.deepEqual(await callLib("map", {}, fnDontCall), {});
  t.is(await libErrAsync("map", null), "TypeError: only works on collections");
  t.is(await libErrAsync("map", "012"), "TypeError: only works on collections");
  t.deepEqual(
    await callLib(
      "map",
      { a: 1, b: 2, c: 3 },
      krl.Function(["v", "k"], (v, k) => v + k)
    ),
    { a: "1a", b: "2b", c: "3c" }
  );

  t.deepEqual(
    await callLib(
      "pairwise",
      [a, [6, 7, 8]],
      krl.Function(["x", "y"], (x, y) => x + y)
    ),
    [9, 11, 13]
  );
  t.deepEqual(
    await callLib(
      "pairwise",
      [a, "abcdef".split("")],
      krl.Function(["x", "y"], function (x, y) {
        return stdlib["+"](this, [x, y]);
      })
    ),
    ["3a", "4b", "5c", "nulld", "nulle", "nullf"]
  );
  t.deepEqual(a, [3, 4, 5], "should not be mutated");
  t.deepEqual(await callLib("pairwise", [[], []], fnDontCall), []);

  t.deepEqual(
    await callLib(
      "pairwise",
      [[], 1],
      krl.Function(["l", "r"], (l, r) => [l, r])
    ),
    [[void 0, 1]]
  );
  t.deepEqual(
    await libErrAsync("pairwise", {}),
    "TypeError: The .pairwise() operator cannot be called on [Map]"
  );
  t.deepEqual(
    await libErrAsync("pairwise", [[]]),
    "TypeError: The .pairwise() operator needs a longer array"
  );
  t.deepEqual(
    await libErrAsync("pairwise", [[], []]),
    "TypeError: The .pairwise() operator cannot use null as a function"
  );

  t.is(
    await callLib(
      "reduce",
      a,
      krl.Function(["a", "b"], (a, b) => a + b)
    ),
    12
  );
  t.is(
    await callLib(
      "reduce",
      a,
      krl.Function(["a", "b"], (a, b) => a + b),
      10
    ),
    22
  );
  t.is(
    await callLib(
      "reduce",
      a,
      krl.Function(["a", "b"], (a, b) => a - b)
    ),
    -6
  );
  t.deepEqual(a, [3, 4, 5], "should not be mutated");
  // await ytf("reduce", [[], fnDontCall], 0);
  t.is(await callLib("reduce", [], fnDontCall), 0);
  t.is(await callLib("reduce", [], fnDontCall, 0), 0);
  t.is(await libErrAsync("reduce", 42), "TypeError: only works on Arrays");

  t.deepEqual(await callLib("reverse", a), [5, 4, 3]);
  t.deepEqual(a, [3, 4, 5], "should not be mutated");
  t.is(libErr("reverse", 42), "TypeError: only works on Arrays");

  const veggies = [
    "corn",
    "tomato",
    "tomato",
    "tomato",
    "sprouts",
    "lettuce",
    "sprouts",
  ];
  t.deepEqual(callLib("slice", veggies, 1, 4), [
    "tomato",
    "tomato",
    "tomato",
    "sprouts",
  ]);
  t.deepEqual(callLib("slice", veggies, 2, 0), ["corn", "tomato", "tomato"]);
  t.deepEqual(callLib("slice", veggies, 2), ["corn", "tomato", "tomato"]);
  t.deepEqual(callLib("slice", veggies, 0, 0), ["corn"]);
  t.deepEqual(callLib("slice", veggies, null, NaN), ["corn"]);
  t.deepEqual(callLib("slice", [], 0, 0), []);
  t.is(libErr("slice", { "0": "0" }, 0, 0), "TypeError: only works on Arrays");
  t.is(
    libErr("slice", veggies, _.noop),
    "TypeError: The .slice() operator cannot use [JSObject] as an index"
  );
  t.is(
    libErr("slice", veggies, 1, _.noop),
    "TypeError: The .slice() operator cannot use [JSObject] as the other index"
  );
  t.deepEqual(callLib("slice", veggies, 14), []);
  t.deepEqual(callLib("slice", veggies, 2, -1), []);
  t.deepEqual(
    veggies,
    ["corn", "tomato", "tomato", "tomato", "sprouts", "lettuce", "sprouts"],
    "should not be mutated"
  );

  t.deepEqual(callLib("splice", veggies, 1, 4), ["corn", "lettuce", "sprouts"]);
  t.deepEqual(callLib("splice", veggies, 2, 0, ["corn", "tomato"]), [
    "corn",
    "tomato",
    "corn",
    "tomato",
    "tomato",
    "tomato",
    "sprouts",
    "lettuce",
    "sprouts",
  ]);
  t.deepEqual(callLib("splice", veggies, 2, 0, "liver"), [
    "corn",
    "tomato",
    "liver",
    "tomato",
    "tomato",
    "sprouts",
    "lettuce",
    "sprouts",
  ]);
  t.deepEqual(callLib("splice", veggies, 2, 2, "liver"), [
    "corn",
    "tomato",
    "liver",
    "sprouts",
    "lettuce",
    "sprouts",
  ]);
  t.deepEqual(callLib("splice", veggies, 1, 10), ["corn"]);
  t.deepEqual(callLib("splice", veggies, 1, 10, "liver"), ["corn", "liver"]);
  t.deepEqual(callLib("splice", veggies, 1, 10, []), ["corn"]);
  t.deepEqual(callLib("splice", [], 0, 1), []);
  t.deepEqual(callLib("splice", [], NaN), []);

  t.deepEqual(libErr("splice"), "TypeError: only works on Arrays");
  t.is(
    libErr("splice", veggies, _.noop, 1),
    "TypeError: The .splice() operator cannot use [JSObject]as an index"
  );
  t.is(
    libErr("splice", veggies, _.noop),
    "TypeError: The .splice() operator cannot use [JSObject]as an index"
  );
  t.deepEqual(callLib("splice", veggies, 0, 0), veggies);
  t.deepEqual(callLib("splice", veggies, 0, veggies.length), []);
  t.deepEqual(callLib("splice", veggies, 0, 999), []);
  t.deepEqual(callLib("splice", veggies, 0, -1), []);
  t.deepEqual(callLib("splice", veggies, 0, -999), []);
  t.deepEqual(callLib("splice", veggies, -1, 0), veggies);
  t.deepEqual(callLib("splice", veggies, -999, 0), veggies);

  t.deepEqual(
    veggies,
    ["corn", "tomato", "tomato", "tomato", "sprouts", "lettuce", "sprouts"],
    "should not be mutated"
  );

  t.deepEqual(callLib("delete", obj, ["foo", "bar", 10]), {
    colors: "many",
    pi: [3, 1, 4, 1, 5, 9, 3],
    foo: { bar: {} },
  });
  t.deepEqual(callLib("delete", { "0": void 0 }, "1"), { "0": void 0 });

  t.is(callLib("encode", { blah: 1 }), '{"blah":1}');
  t.is(callLib("encode", [1, 2]), "[1,2]");
  t.is(callLib("encode", 12), "12");
  t.is(callLib("encode", "12"), '"12"');
  // all nulls are treated the same
  t.is(callLib("encode", null), "null");
  t.is(callLib("encode", NaN), "null");
  t.is(callLib("encode", void 0), "null");
  // use .as("String") rules for other types
  t.is(
    callLib(
      "encode",
      krl.Action([], () => null)
    ),
    '"[Action]"'
  );
  t.is(callLib("encode", /a/gi), '"re#a#gi"');
  (function (a: string, b: string) {
    t.is(callLib("encode", arguments), '{"0":"a","1":"b"}');
  })("a", "b");
  // testing it nested
  t.is(
    callLib("encode", { fn: _.noop, n: NaN, u: void 0 }),
    '{"fn":"[JSObject]","n":null,"u":null}'
  );

  // testing indent options
  t.is(callLib("encode", { a: 1, b: 2 }, 0), '{"a":1,"b":2}');
  t.is(callLib("encode", { a: 1, b: 2 }, 4), '{\n    "a": 1,\n    "b": 2\n}');
  t.is(callLib("encode", { a: 1, b: 2 }, "2"), '{\n  "a": 1,\n  "b": 2\n}');
  t.is(
    callLib("encode", { a: 1, b: 2 }, null),
    '{"a":1,"b":2}',
    "default indent to 0"
  );
  t.is(
    callLib("encode", { a: 1, b: 2 }, _.noop),
    '{"a":1,"b":2}',
    "default indent to 0"
  );

  t.deepEqual(callLib("keys", obj), ["colors", "pi", "foo"]);
  t.deepEqual(callLib("keys", obj, ["foo", "bar"]), ["10"]);
  t.deepEqual(callLib("keys", obj, ["pi"]), [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
  ]);
  t.deepEqual(callLib("keys", obj, ["foo", "not"]), [], "bad path");
  t.deepEqual(callLib("keys", ["wat", { da: "heck" }]), ["0", "1"]);
  t.deepEqual(callLib("keys", null), [], "not a map or array");
  t.deepEqual(callLib("keys", _.noop), [], "not a map or array");
  t.deepEqual(callLib("keys", { a: "b" }, "not-found"), [], "bad path");

  t.deepEqual(callLib("values", obj), [
    "many",
    [3, 1, 4, 1, 5, 9, 3],
    { bar: { "10": "I like cheese" } },
  ]);
  t.deepEqual(callLib("values", obj, ["foo", "bar"]), ["I like cheese"]);
  t.deepEqual(callLib("values", obj, ["pi"]), [3, 1, 4, 1, 5, 9, 3]);
  t.deepEqual(callLib("values", obj, ["foo", "not"]), []);
  t.deepEqual(callLib("values", ["an", "array"]), ["an", "array"]);
  t.deepEqual(callLib("values", void 0), [], "not a map or array");
  t.deepEqual(callLib("values", _.noop), [], "not a map or array");

  t.deepEqual(
    callLib("intersection", [[2], 2, 1, null], [[2], "1", 2, void 0]),
    [[2], 2, null]
  );
  t.deepEqual(callLib("intersection", [[0], {}], [[1], []]), []);
  t.deepEqual(callLib("intersection", []), []);
  t.deepEqual(callLib("intersection", [{}]), []);
  t.deepEqual(callLib("intersection", {}, [{}]), [{}]);

  t.deepEqual(callLib("union", [2], [1, 2]), [2, 1]);
  t.deepEqual(callLib("union", [1, 2], [1, 4]), [1, 2, 4]);
  t.deepEqual(callLib("union", [{ x: 2 }], [{ x: 1 }]), [{ x: 2 }, { x: 1 }]);
  t.deepEqual(callLib("union", []), []);
  t.deepEqual(callLib("union", [], { x: 1 }), [{ x: 1 }]);
  t.deepEqual(callLib("union", { x: 1 }, []), [{ x: 1 }]);
  t.deepEqual(callLib("union", { x: 1 }), { x: 1 });

  t.deepEqual(callLib("difference", [2, 1], [2, 3]), [1]);
  t.deepEqual(callLib("difference", [2, 1], 2), [1]);
  t.deepEqual(
    callLib("difference", [{ x: 2 }, { x: 1 }], [{ x: 2 }, { x: 3 }]),
    [{ x: 1 }]
  );
  t.deepEqual(callLib("difference", { x: null }, []), [{ x: null }]);
  t.deepEqual(callLib("difference", { x: null }), { x: null });

  t.deepEqual(callLib("has", [1, 2, 3, 4], [4, 2]), true);
  t.deepEqual(callLib("has", [1, 2, 3, 4], [4, 5]), false);
  t.deepEqual(callLib("has", [[null, [_.noop]]], [[void 0, [_.noop]]]), true);
  t.deepEqual(callLib("has", [], []), true);
  t.deepEqual(callLib("has", [], null), false);
  t.deepEqual(callLib("has", []), false);

  t.deepEqual(callLib("once", [1, 2, 1, 3, 4, 4]), [2, 3]);
  t.deepEqual(callLib("once", { a: void 0 }), { a: void 0 });
  t.deepEqual(callLib("once", [1, NaN, "a"]), [1, null, "a"]);

  t.deepEqual(callLib("duplicates", [1, 2, 1, 3, 4, 4]), [1, 4]);
  t.deepEqual(callLib("duplicates", { "0": 1, "1": 1 }), []);
  t.deepEqual(callLib("duplicates", [1, 3, null, NaN, void 0, 3]), [3, null]);

  t.deepEqual(callLib("unique", [1, 2, 1, [3], [4], [4]]), [1, 2, [3], [4]]);
  t.deepEqual(callLib("unique", { "0": 1, "1": 1 }), { "0": 1, "1": 1 });

  t.deepEqual(callLib("get", obj, ["foo", "bar", "10"]), "I like cheese");
  t.deepEqual(callLib("get", obj, "colors"), "many");
  t.deepEqual(callLib("get", obj, ["pi", 2]), 4);
  t.deepEqual(
    callLib("get", ["a", "b", { c: ["d", "e"] }], [2, "c", 1]),
    "e",
    "get works on arrays and objects equally"
  );
  t.deepEqual(
    callLib("get", ["a", "b", { c: ["d", "e"] }], ["2", "c", "1"]),
    "e",
    "array indices can be strings"
  );

  t.deepEqual(callLib("set", obj, ["foo", "baz"], "qux"), {
    colors: "many",
    pi: [3, 1, 4, 1, 5, 9, 3],
    foo: {
      bar: { "10": "I like cheese" },
      baz: "qux",
    },
  });
  t.deepEqual(callLib("set", obj, "flop", 12), {
    colors: "many",
    pi: [3, 1, 4, 1, 5, 9, 3],
    foo: {
      bar: { "10": "I like cheese" },
    },
    flop: 12,
  });
  t.deepEqual(callLib("set", obj, "colors", ["R", "G", "B"]), {
    colors: ["R", "G", "B"],
    pi: [3, 1, 4, 1, 5, 9, 3],
    foo: {
      bar: { "10": "I like cheese" },
    },
  });
  t.deepEqual(
    callLib("set", obj, ["foo", "bar", "10"], "modified a sub object"),
    {
      colors: "many",
      pi: [3, 1, 4, 1, 5, 9, 3],
      foo: {
        bar: { "10": "modified a sub object" },
      },
    }
  );
  t.deepEqual(callLib("set", obj, ["pi", 4, "a"], "wat?"), {
    colors: "many",
    pi: [3, 1, 4, 1, { a: "wat?" }, 9, 3],
    foo: { bar: { "10": "I like cheese" } },
  });

  t.deepEqual(callLib("set", ["a", "b", "c"], [1], "wat?"), ["a", "wat?", "c"]);
  t.deepEqual(callLib("set", ["a", "b", "c"], ["1"], "wat?"), [
    "a",
    "wat?",
    "c",
  ]);
  t.deepEqual(callLib("set", [{ a: [{ b: 1 }] }], [0, "a", 0, "b"], "wat?"), [
    { a: [{ b: "wat?" }] },
  ]);

  t.deepEqual(callLib("put", { key: 5 }, { foo: "bar" }), {
    key: 5,
    foo: "bar",
  });
  t.deepEqual(callLib("put", { key: 5 }, [], { foo: "bar" }), {
    key: 5,
    foo: "bar",
  });
  t.deepEqual(callLib("put", { key: 5 }, ["baz"], { foo: "bar" }), {
    key: 5,
    baz: { foo: "bar" },
  });
  t.deepEqual(callLib("put", { key: 5 }, ["qux"], "wat?"), {
    key: 5,
    qux: "wat?",
  });
  t.deepEqual(callLib("put", { key: 5 }, [null], "wat?"), {
    key: 5,
    null: "wat?",
  });
  t.deepEqual(callLib("put", { key: 5 }, [void 0], "wat?"), {
    key: 5,
    null: "wat?",
  });
  t.deepEqual(callLib("put", { key: 5 }, [void 0], "wat?"), {
    key: 5,
    null: "wat?",
  });
  t.deepEqual(callLib("put", { key: 5 }, [NaN], "wat?"), {
    key: 5,
    null: "wat?",
  });
  t.deepEqual(callLib("put", { key: 5 }, [_.noop], "wat?"), {
    key: 5,
    "[JSObject]": "wat?",
  });

  t.deepEqual(
    callLib("put", obj, ["foo"], { baz: "qux" }),
    {
      colors: "many",
      pi: [3, 1, 4, 1, 5, 9, 3],
      foo: { baz: "qux" },
    },
    "overwrite at the path, even if to_set and curr val are both maps"
  );
  t.deepEqual(callLib("put", obj, ["foo", "bar", 11], "wat?"), {
    colors: "many",
    pi: [3, 1, 4, 1, 5, 9, 3],
    foo: {
      bar: {
        "10": "I like cheese",
        "11": "wat?",
      },
    },
  });
  t.deepEqual(callLib("put", obj, ["foo", "bar", 10], "no cheese"), {
    colors: "many",
    pi: [3, 1, 4, 1, 5, 9, 3],
    foo: {
      bar: { "10": "no cheese" },
    },
  });
  t.deepEqual(callLib("put", obj, { flop: 12 }), {
    colors: "many",
    pi: [3, 1, 4, 1, 5, 9, 3],
    foo: { bar: { "10": "I like cheese" } },
    flop: 12,
  });

  t.deepEqual(callLib("put", {}, ["key1"], "value2"), { key1: "value2" });
  t.deepEqual(callLib("put", {}, [], { key2: "value3" }), { key2: "value3" });
  t.deepEqual(callLib("put", { key: 5 }, "foo", { key2: "value3" }), {
    key: 5,
    foo: { key2: "value3" },
  });
  t.deepEqual(callLib("put", { key: 5 }, "key", 7), { key: 7 });
  t.deepEqual(callLib("put", { key: 5 }, ["key"], 9), { key: 9 });

  t.deepEqual(
    callLib("put", 5, ["key"], 9),
    5,
    "if val is not a Map or Array, return the val"
  );
  t.deepEqual(
    callLib("put", "wat", ["key"], 9),
    "wat",
    "if val is not a Map or Array, return the val"
  );
  t.deepEqual(
    callLib("put", null, ["key"], 9),
    null,
    "if val is not a Map or Array, return the val"
  );
  t.deepEqual(
    callLib("put", { a: null, b: void 0 }),
    { a: null, b: void 0 },
    "if no arguments, return the val"
  );

  t.is(
    JSON.stringify(callLib("put", {}, ["0", "0"], "foo")),
    '{"0":{"0":"foo"}}',
    'don\'t use arrays by default, i.e. don\'t do {"0":["foo"]}'
  );
  t.is(
    JSON.stringify(callLib("put", {}, [0, 1], "foo")),
    '{"0":{"1":"foo"}}',
    'don\'t do {"0":[null,"foo"]}'
  );
  t.is(JSON.stringify(callLib("put", [], [0, 0], "foo")), '[{"0":"foo"}]');
  t.is(
    JSON.stringify(callLib("put", [["wat?"]], [0, 0], "foo")),
    '[["foo"]]',
    "if the nested value is an array, keep it an array"
  );

  t.is(
    JSON.stringify(callLib("put", {}, ["a", "b"], [])),
    '{"a":{"b":[]}}',
    "preserve type of to_set"
  );
  t.is(
    JSON.stringify(callLib("put", [], [0], ["foo"])),
    '[["foo"]]',
    "preserve type of to_set"
  );
  t.is(
    JSON.stringify(callLib("put", [], [], ["foo"])),
    '["foo"]',
    "preserve type of to_set"
  );
  t.is(
    JSON.stringify(callLib("put", {}, "foo", [0])),
    '{"foo":[0]}',
    "preserve type of to_set"
  );
  t.is(
    JSON.stringify(callLib("put", {}, "foo", ["bar"])),
    '{"foo":["bar"]}',
    "preserve type of to_set"
  );
  t.is(
    JSON.stringify(
      callLib("put", [{ foo: 1 }, { bar: 2 }], [1, "bar", "baz"], 4)
    ),
    '[{"foo":1},{"bar":{"baz":4}}]'
  );

  t.is(
    JSON.stringify(callLib("put", { one: [2, 3] }, ["one", 1], 4)),
    '{"one":[2,4]}',
    "number index"
  );
  t.is(
    JSON.stringify(callLib("put", { one: [2, 3] }, ["one", "1"], 4)),
    '{"one":[2,4]}',
    "Array index can be a string"
  );
  t.is(
    JSON.stringify(callLib("put", { one: [2, 3] }, ["one", "2"], 4)),
    '{"one":[2,3,4]}',
    "Array index at the end"
  );
  t.is(
    JSON.stringify(callLib("put", { one: [2, 3] }, ["one", "3"], 4)),
    '{"one":{"0":2,"1":3,"3":4}}',
    "convert Array to Map if sparse array is attempted"
  );
  t.is(
    JSON.stringify(callLib("put", { one: [2, 3] }, ["one", "foo"], 4)),
    '{"one":{"0":2,"1":3,"foo":4}}',
    "convert Array to Map if non-index path is given"
  );
  t.is(
    JSON.stringify(callLib("put", { one: [2, 3] }, ["one", "foo", "0"], 4)),
    '{"one":{"0":2,"1":3,"foo":{"0":4}}}',
    "convert Array to Map if non-index path is given"
  );

  const toSort = [5, 3, 4, 1, 12];
  t.deepEqual(callLib("sort", null, "numeric"), null);
  t.deepEqual(callLib("sort", toSort), [1, 12, 3, 4, 5]);
  t.deepEqual(
    callLib(
      "sort",
      toSort,
      krl.Action([], () => null)
    ),
    [1, 12, 3, 4, 5]
  );
  t.deepEqual(callLib("sort", toSort, "default"), [1, 12, 3, 4, 5]);
  t.deepEqual(callLib("sort", toSort, "reverse"), [5, 4, 3, 12, 1]);
  t.deepEqual(callLib("sort", toSort, "numeric"), [1, 3, 4, 5, 12]);
  t.deepEqual(callLib("sort", toSort, "ciremun"), [12, 5, 4, 3, 1]);

  t.deepEqual(
    await callLib(
      "sort",
      toSort,
      krl.Function(["a", "b"], (a: any, b: any) =>
        a < b ? -1 : a === b ? 0 : 1
      )
    ),
    [1, 3, 4, 5, 12]
  );
  t.deepEqual(
    await callLib(
      "sort",
      toSort,
      krl.Function(["a", "b"], (a: any, b: any) =>
        a > b ? -1 : a === b ? 0 : 1
      )
    ),
    [12, 5, 4, 3, 1]
  );
  t.deepEqual(toSort, [5, 3, 4, 1, 12], "should not be mutated");

  t.deepEqual(
    await callLib(
      "sort",
      [],
      krl.Function(["a", "b"], (a: any, b: any) =>
        a < b ? -1 : a === b ? 0 : 1
      )
    ),
    []
  );
  t.deepEqual(
    await callLib(
      "sort",
      [1],
      krl.Function(["a", "b"], (a: any, b: any) =>
        a < b ? -1 : a === b ? 0 : 1
      )
    ),
    [1]
  );
  t.deepEqual(
    await callLib(
      "sort",
      [2, 1],
      krl.Function(["a", "b"], (a: any, b: any) =>
        a < b ? -1 : a === b ? 0 : 1
      )
    ),
    [1, 2]
  );
  t.deepEqual(
    await callLib(
      "sort",
      [2, 3, 1],
      krl.Function(["a", "b"], (a: any, b: any) =>
        a < b ? -1 : a === b ? 0 : 1
      )
    ),
    [1, 2, 3]
  );
});
