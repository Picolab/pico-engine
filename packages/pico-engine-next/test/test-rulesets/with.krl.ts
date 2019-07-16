import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("with.krl", async t => {
  const { mkQuery } = await startTestEngine(["with.krl"]);
  const query = mkQuery("io.picolabs.with");

  t.is(await query("add", { a: -2, b: 5 }), 3);
  t.is(await query("inc", { n: 4 }), 5);
  t.is(await query("foo", { a: 3 }), 9);
});
