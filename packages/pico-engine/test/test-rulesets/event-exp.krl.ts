import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("event-exp.krl", async t => {
  const { signal } = await startTestEngine(["event-exp.krl"]);

  const signalTests: [string, string, any?, any?][] = [
    ["ee_before", "a"],
    ["ee_before", "b", {}, "before"],
    ["ee_before", "b"],
    ["ee_before", "b"],
    ["ee_before", "a"],
    ["ee_before", "a"],
    ["ee_before", "c"],
    ["ee_before", "b", {}, "before"],

    ["ee_after", "a"],
    ["ee_after", "b"],
    ["ee_after", "a", {}, "after"],
    ["ee_after", "a"],
    ["ee_after", "a"],
    ["ee_after", "b"],
    ["ee_after", "c"],
    ["ee_after", "a", {}, "after"],

    ["ee_then", "a", { name: "bob" }],
    ["ee_then", "b", { name: "bob" }, "then"],
    ["ee_then", "b", { name: "bob" }],
    ["ee_then", "a", { name: "bob" }],
    ["ee_then", "b", { name: "..." }],
    ["ee_then", "b", { name: "bob" }],

    ["ee_and", "a"],
    ["ee_and", "c"],
    ["ee_and", "b", {}, "and"],
    ["ee_and", "b"],
    ["ee_and", "a", {}, "and"],
    ["ee_and", "b"],
    ["ee_and", "b"],
    ["ee_and", "b"],
    ["ee_and", "a", {}, "and"],

    ["ee_or", "a", {}, "or"],
    ["ee_or", "b", {}, "or"],
    ["ee_or", "c"],

    ["ee_between", "b"],
    ["ee_between", "a"],
    ["ee_between", "c", {}, "between"],
    ["ee_between", "b"],
    ["ee_between", "a"],
    ["ee_between", "a"],
    ["ee_between", "c", {}, "between"],
    ["ee_between", "b"],
    ["ee_between", "a"],
    ["ee_between", "b"],
    ["ee_between", "c", {}, "between"],

    ["ee_not_between", "b"],
    ["ee_not_between", "c", {}, "not between"],
    ["ee_not_between", "b"],
    ["ee_not_between", "a"],
    ["ee_not_between", "c"],
    ["ee_not_between", "b"],
    ["ee_not_between", "c", {}, "not between"],
    ["ee_not_between", "c"],

    ["ee_andor", "c", {}, "(a and b) or c"],
    ["ee_andor", "a"],
    ["ee_andor", "c"],
    ["ee_andor", "b", {}, "(a and b) or c"],

    ["ee_orand", "a"],
    ["ee_orand", "b", {}, "a and (b or c)"],
    ["ee_orand", "c"],
    ["ee_orand", "a", {}, "a and (b or c)"],

    ["ee_and_n", "a"],
    ["ee_and_n", "c"],
    ["ee_and_n", "b", {}, "and_n"],

    ["ee_or_n", "a", {}, "or_n"],
    ["ee_or_n", "d", {}, "or_n"],

    ["ee_any", "a"],
    ["ee_any", "a"],
    ["ee_any", "b", {}, "any"],
    ["ee_any", "c"],
    ["ee_any", "a", {}, "any"],

    ["ee_count", "a"],
    ["ee_count", "a"],
    ["ee_count", "a", {}, "count"],
    ["ee_count", "a"],
    ["ee_count", "a"],
    ["ee_count", "a", {}, "count"],
    ["ee_count", "a"],

    ["ee_repeat", "a", { name: "bob" }],
    ["ee_repeat", "a", { name: "bob" }],
    ["ee_repeat", "a", { name: "bob" }, "repeat"],
    ["ee_repeat", "a", { name: "bob" }, "repeat"],
    ["ee_repeat", "a", { name: "..." }],
    ["ee_repeat", "a", { name: "bob" }],

    ["ee_count_max", "a", { b: "3" }],
    ["ee_count_max", "a", { b: "8" }],
    ["ee_count_max", "a", { b: "5" }, { name: "count_max", options: { m: 8 } }],
    ["ee_count_max", "a", { b: "1" }],
    ["ee_count_max", "a", { b: "0" }],
    ["ee_count_max", "a", { b: "0" }, { name: "count_max", options: { m: 1 } }],
    ["ee_count_max", "a", { b: "0" }],
    ["ee_count_max", "a", { b: "0" }],
    ["ee_count_max", "a", { b: "7" }, { name: "count_max", options: { m: 7 } }],

    ["ee_repeat_min", "a", { b: "5" }],
    ["ee_repeat_min", "a", { b: "3" }],
    [
      "ee_repeat_min",
      "a",
      { b: "4" },
      { name: "repeat_min", options: { m: 3 } }
    ],
    [
      "ee_repeat_min",
      "a",
      { b: "5" },
      { name: "repeat_min", options: { m: 3 } }
    ],
    [
      "ee_repeat_min",
      "a",
      { b: "6" },
      { name: "repeat_min", options: { m: 4 } }
    ],
    ["ee_repeat_min", "a", { b: null }],
    ["ee_repeat_min", "a", { b: "3" }],
    ["ee_repeat_min", "a", { b: "8" }],
    [
      "ee_repeat_min",
      "a",
      { b: "1" },
      { name: "repeat_min", options: { m: 1 } }
    ],
    [
      "ee_repeat_min",
      "a",
      { b: "2" },
      { name: "repeat_min", options: { m: 1 } }
    ],
    [
      "ee_repeat_min",
      "a",
      { b: "3" },
      { name: "repeat_min", options: { m: 1 } }
    ],
    [
      "ee_repeat_min",
      "a",
      { b: "4" },
      { name: "repeat_min", options: { m: 2 } }
    ],
    [
      "ee_repeat_min",
      "a",
      { b: "5" },
      { name: "repeat_min", options: { m: 3 } }
    ],
    [
      "ee_repeat_min",
      "a",
      { b: "6" },
      { name: "repeat_min", options: { m: 4 } }
    ],
    [
      "ee_repeat_min",
      "a",
      { b: "7" },
      { name: "repeat_min", options: { m: 5 } }
    ],

    ["ee_repeat_sum", "a", { b: "1" }],
    ["ee_repeat_sum", "a", { b: "2" }],
    [
      "ee_repeat_sum",
      "a",
      { b: "3" },
      { name: "repeat_sum", options: { m: 6 } }
    ],
    [
      "ee_repeat_sum",
      "a",
      { b: "4" },
      { name: "repeat_sum", options: { m: 9 } }
    ],

    ["ee_repeat_avg", "a", { b: "1" }],
    ["ee_repeat_avg", "a", { b: "2" }],
    [
      "ee_repeat_avg",
      "a",
      { b: "3" },
      { name: "repeat_avg", options: { m: 2 } }
    ],
    [
      "ee_repeat_avg",
      "a",
      { b: "100" },
      { name: "repeat_avg", options: { m: 35 } }
    ],

    ["ee_repeat_push", "a", { b: "1" }],
    ["ee_repeat_push", "a", { b: "2" }],
    [
      "ee_repeat_push",
      "a",
      { b: "3" },
      { name: "repeat_push", options: { m: ["1", "2", "3"] } }
    ],
    [
      "ee_repeat_push",
      "a",
      { b: "4" },
      { name: "repeat_push", options: { m: ["2", "3", "4"] } }
    ],
    ["ee_repeat_push", "a", { b: "five" }],
    ["ee_repeat_push", "a", { b: "6" }],
    ["ee_repeat_push", "a", { b: "7" }],
    [
      "ee_repeat_push",
      "a",
      { b: "8" },
      { name: "repeat_push", options: { m: ["6", "7", "8"] } }
    ],

    ["ee_repeat_push_multi", "a", { a: "1", b: "2 three" }],
    ["ee_repeat_push_multi", "a", { a: "2", b: "3 four" }],
    ["ee_repeat_push_multi", "a", { a: "3", b: "4 five" }],
    ["ee_repeat_push_multi", "a", { a: "4", b: "5 six" }],
    [
      "ee_repeat_push_multi",
      "a",
      { a: "5", b: "6 seven" },
      {
        name: "repeat_push_multi",
        options: {
          a: ["1", "2", "3", "4", "5"],
          b: ["2", "3", "4", "5", "6"],
          c: ["three", "four", "five", "six", "seven"],
          d: [undefined, undefined, undefined, undefined, undefined]
        }
      }
    ],

    ["ee_repeat_sum_multi", "a", { a: "1", b: "2" }],
    ["ee_repeat_sum_multi", "a", { a: "2", b: "3" }],
    [
      "ee_repeat_sum_multi",
      "a",
      { a: "3", b: "4" },
      {
        name: "repeat_sum_multi",
        options: {
          a: 6,
          b: 9
        }
      }
    ],

    ["ee_or_duppath", "a", {}, "(a before a) or a"],
    ["ee_or_duppath", "a", {}, "(a before a) or a"],

    ["ee_notbet_duppath", "a"],
    ["ee_notbet_duppath", "b"],
    ["ee_notbet_duppath", "a", {}, "a not between (b, a)"],

    ["ee_ab_or_b", "b", {}, "(a and b) or b"],
    ["ee_ab_or_b", "a"],
    ["ee_ab_or_b", "b", {}, "(a and b) or b"],
    ["ee_ab_or_b", "b", {}, "(a and b) or b"],
    ["ee_ab_or_b", "a"],

    ["ee_ab_or_ca", "a"],
    ["ee_ab_or_ca", "c", {}, "(a and b) or (c and a)"],
    ["ee_ab_or_ca", "a"],
    ["ee_ab_or_ca", "b", {}, "(a and b) or (c and a)"]
  ];

  for (const [domain, name, attrs, resp] of signalTests) {
    const answer = [];
    if (typeof resp === "string") {
      answer.push({ name: resp, options: {} });
    } else if (resp) {
      answer.push(resp);
    }
    t.deepEqual(
      await signal(domain, name, attrs),
      answer,
      `${domain}:${name}?${JSON.stringify(attrs || {})} -> ${JSON.stringify(
        resp
      )}`
    );
  }
});
