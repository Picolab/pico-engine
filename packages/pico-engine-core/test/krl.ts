import test from "ava";
import { krl } from "krl-stdlib";
import * as _ from "lodash";

test("KRL function args", async (t) => {
  let lastArgs: any;

  const fn = krl.Function(["a", "b", "c"], function () {
    lastArgs = _.toArray(arguments);
  });

  fn(null as any, [1, 2]);
  t.deepEqual(lastArgs, [1, 2]);

  fn(null as any, { b: "something" });
  t.deepEqual(lastArgs, [undefined, "something"]);

  fn(null as any, undefined);
  t.deepEqual(lastArgs, []);

  fn(null as any, { "0": "A1", c: 3 });
  t.deepEqual(lastArgs, ["A1", void 0, 3]);
});

test("isMap", async (t) => {
  t.false(krl.isMap(null));
  t.false(krl.isMap(void 0));
  t.false(krl.isMap(NaN));
  t.false(krl.isMap(_.noop));
  t.false(krl.isMap(/a/i));
  t.false(krl.isMap([1, 2]));
  t.false(krl.isMap(new Array(2)));
  t.false(krl.isMap("foo"));
  t.false(krl.isMap(new String("bar"))); // eslint-disable-line
  t.false(krl.isMap(10));
  t.false(krl.isMap(new Number(10))); // eslint-disable-line

  t.true(krl.isMap({}));
  t.true(krl.isMap({ a: 1, b: 2 }));
});
