import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("within.krl", async t => {
  const { signal } = await startTestEngine(["within.krl"], {
    useEventInputTime: true
  });

  const tests: any = [
    [10000000000000, "foo", "a"],
    [10000000000001, "foo", "b", {}, "foo"],
    [10000000000002, "foo", "a"],
    [10000000555555, "foo", "b"],
    [10000000555556, "foo", "a"],
    [10000000255557, "foo", "b", {}, "foo"],

    [10000000000000, "bar", "a"],
    [10000000003999, "bar", "b", {}, "bar"],
    [10000000000000, "bar", "a"],
    [10000000004000, "bar", "b", {}, "bar"],
    [10000000000000, "bar", "a"],
    [10000000004001, "bar", "b"],

    [10000000000000, "baz", "a", {}, "baz"],
    [10000000000000, "baz", "b"],
    [10031536000000, "baz", "c", {}, "baz"],
    [10000000000000, "baz", "c"],
    [10040000000000, "baz", "b"],
    [10050000000000, "baz", "c", {}, "baz"],

    [10000000000000, "qux", "a", { b: "c" }],
    [10000000000001, "qux", "a", { b: "c" }],
    [10000000001002, "qux", "a", { b: "c" }, "qux"],
    [10000000002003, "qux", "a", { b: "c" }],
    [10000000002004, "qux", "a", { b: "c" }],
    [10000000002005, "qux", "a", { b: "c" }, "qux"],
    [10000000002006, "qux", "a", { b: "c" }, "qux"],
    [10000000002007, "qux", "a", { b: "z" }],
    [10000000002008, "qux", "a", { b: "c" }],
    [10000000002009, "qux", "a", { b: "c" }],
    [10000000004008, "qux", "a", { b: "c" }, "qux"]
  ];
  for (const p of tests) {
    var ans = [];
    if (typeof p[4] === "string") {
      ans.push({ name: p[4], options: {} });
    } else if (p[4]) {
      ans.push(p[4]);
    }
    t.deepEqual(await signal(p[1], p[2], p[3], p[0]), ans);
  }
});
