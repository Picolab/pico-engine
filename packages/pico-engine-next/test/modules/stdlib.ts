import test from "ava";
import stdlib from "../../src/modules/stdlib";
import { makeKrlCtx } from "../helpers/makeKrlCtx";

test("stdlib", async t => {
  let krlCtx = await makeKrlCtx();

  t.is(stdlib["+"](krlCtx, [1, 2]), 3);
});
