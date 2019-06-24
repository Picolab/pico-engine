import test from "ava";
import * as _ from "lodash";
import mkKrl from "../src/krl";

test("KRL function args", async t => {
  let lastArgs: any;

  const fn = mkKrl.function(["a", "b", "c"], function() {
    lastArgs = _.toArray(arguments);
  });

  fn(null as any, [1, 2]);
  t.deepEqual(lastArgs, [1, 2]);

  fn(null as any, { b: "something" });
  t.deepEqual(lastArgs, [undefined, "something"]);

  fn(null as any, undefined);
  t.deepEqual(lastArgs, []);
});
